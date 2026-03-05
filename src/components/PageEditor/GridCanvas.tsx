'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { Layout } from 'react-grid-layout'
import GridLayout from 'react-grid-layout/legacy'
// import WidthProvider from 'react-grid-layout/build/WidthProvider'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
import { WidgetRenderer } from './WidgetRenderer'
import type { GridWidget, LayoutChangeEvent } from '@/types/layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './GridCanvas.css'

// const AutoWidthGridLayout = WidthProvider(GridLayout as any) as any

export interface GridCanvasProps {
  /**
   * Si true, permite drag/resize de componentes
   */
  isEditing: boolean

  /**
   * Callback cuando hay cambios de layout
   */
  onLayoutChange?: (widgets: GridWidget[]) => void | Promise<void>

  /**
   * Ancho máximo del canvas (en px)
   */
  maxWidth?: number

  /**
   * Breakpoints para responsive (opcional)
   */
  breakpoints?: { [key: string]: number }

  /**
   * Layouts por breakpoint (opcional)
   */
  layouts?: { [key: string]: Layout[] }
}

export function GridCanvas({
  isEditing,
  onLayoutChange,
  maxWidth = 1200,
}: GridCanvasProps) {
  const { layout, updateLayoutPositions, isLoading } = usePageStore()
  const { selectedWidgetId, setSelectedWidget } = useEditorUiStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [gridWidth, setGridWidth] = useState(maxWidth)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  // Evitar error de SSR
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sincronizar ancho real del contenedor para cálculos de drag/drop
  useEffect(() => {
    if (!containerRef) return

    const updateWidth = () => {
      const measured = containerRef.clientWidth || maxWidth
      const bounded = Math.min(measured, maxWidth)
      setGridWidth(bounded > 0 ? bounded : maxWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(containerRef)

    return () => observer.disconnect()
  }, [containerRef, maxWidth])

  /**
   * Maneja cambios de layout desde react-grid-layout
   */
  const handleLayoutCommit = useCallback(
    async (newLayout: readonly any[]) => {
      if (!layout) return

      // Convertir a LayoutChangeEvent
      const changes: LayoutChangeEvent = {
        layout: (newLayout as any).map((item: any) => ({
          widgetId: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        })),
      }

      // Actualizar store
      updateLayoutPositions(changes)

      // Guardar si hay callback
      if (onLayoutChange) {
        setIsSaving(true)
        try {
          const updatedWidgets = layout.widgets.map((widget) => {
            const change = changes.layout.find((c) => c.widgetId === widget.id)
            return change
              ? { ...widget, x: change.x, y: change.y, w: change.w, h: change.h }
              : widget
          })
          await onLayoutChange(updatedWidgets)
        } catch (err) {
          console.error('Error saving layout:', err)
        } finally {
          setIsSaving(false)
        }
      }
    },
    [layout, updateLayoutPositions, onLayoutChange]
  )

  if (!isMounted) {
    return <div className="grid-canvas-loading">Inicializando...</div>
  }

  if (isLoading) {
    return <div className="grid-canvas-loading">Cargando layout...</div>
  }

  // Preparar layout para react-grid-layout
  const gridLayout = layout?.widgets?.map((widget) => ({
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
    i: widget.id,
    static: !isEditing,
  })) || []

  const hasWidgets = layout && layout.widgets.length > 0

  return (
    <div className="grid-canvas-wrapper">
      <div
        ref={setContainerRef}
        className="grid-canvas-container"
        style={{ width: '100%', maxWidth: `${maxWidth}px` }}
        onClick={(event) => {
          if (isEditing && event.target === event.currentTarget) {
            setSelectedWidget(null)
          }
        }}
      >
        {!hasWidgets ? (
          <div className="grid-canvas-empty">
            <div className="text-center p-12">
              <p className="text-gray-500 mb-4">No hay widgets en esta página</p>
              {isEditing && (
                <p className="text-sm text-gray-400">
                  Añade widgets desde el panel lateral
                </p>
              )}
            </div>
          </div>
        ) : (
          React.createElement(GridLayout as React.ComponentType<any>, {
            className: "grid-layout",
            layout: gridLayout,
            cols: 12,
            rowHeight: 50,
            width: gridWidth,
            autoSize: true,
            isDraggable: isEditing,
            isResizable: isEditing,
            resizeHandles: ['se', 's', 'e'],
            onDragStop: (newLayout: readonly any[]) => handleLayoutCommit(newLayout),
            onResizeStop: (newLayout: readonly any[]) => handleLayoutCommit(newLayout),
            compactType: null,
            verticalCompact: false,
            isBounded: false,
            preventCollision: false,
            useCSSTransforms: false,
            maxRows: 100,
            draggableOpts: { axis: 'both' },
            draggableHandle: '.widget-drag-handle',
            draggableCancel: 'input,textarea,button,select,option,.widget-close-btn,.align-btn',
            containerPadding: [16, 16],
            margin: [8, 8],
            children: layout!.widgets.map((widget) => (
              <div
                key={widget.id}
                data-grid={{
                  x: widget.x,
                  y: widget.y,
                  w: widget.w,
                  h: widget.h,
                  i: widget.id,
                  static: !isEditing,
                }}
                className={`grid-item ${isEditing ? 'editing' : ''} ${
                  selectedWidgetId === widget.id ? 'selected' : ''
                } ${
                  isSaving ? 'saving' : ''
                }`}
                data-widget-id={widget.id}
                onClick={(event) => {
                  event.stopPropagation()
                  if (isEditing) setSelectedWidget(widget.id)
                }}
              >
                <WidgetRenderer widget={widget} isEditing={isEditing} />
              </div>
            )),
          })
        )}
      </div>

      {isSaving && (
        <div className="grid-canvas-saving">
          <span>Guardando...</span>
        </div>
      )}
    </div>
  )
}
