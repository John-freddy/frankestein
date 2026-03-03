'use client'

import React from 'react'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
import type { GridWidget } from '@/types/layout'
import { WIDGETS } from '@/widgets/registro'
import './WidgetToolbar.css'

/**
 * Toolbar para agregar widgets al canvas
 */
export function WidgetToolbar() {
  const { layout, addWidget, removeWidget, duplicateWidget } = usePageStore()
  const { selectedWidgetId, setSelectedWidget } = useEditorUiStore()

  const handleAddWidget = (widgetType: keyof typeof WIDGETS) => {
    if (!layout) return

    // Encontrar posición vacía
    let x = 0
    let y = 0

    if (layout.widgets.length > 0) {
      const lastWidget = layout.widgets[layout.widgets.length - 1]
      y = lastWidget.y + lastWidget.h + 1
    }

    const widgetDefinition = WIDGETS[widgetType]

    const newWidget: GridWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      config: { ...widgetDefinition.porDefecto },
      x,
      y,
      w: 3,
      h: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addWidget(newWidget)
    setSelectedWidget(newWidget.id)
  }

  const handleDeleteWidget = () => {
    if (selectedWidgetId) {
      removeWidget(selectedWidgetId)
    }
  }

  const handleDuplicateWidget = () => {
    if (selectedWidgetId) {
      duplicateWidget(selectedWidgetId)
    }
  }

  const widgetTypes = Object.entries(WIDGETS).map(([id, widget]) => ({
    id,
    label: widget.etiqueta,
  }))

  return (
    <div className="widget-toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Widgets</h3>
        <div className="widget-buttons">
          {widgetTypes.map((wt) => (
            <button
              key={wt.id}
              className="widget-btn"
              onClick={() => handleAddWidget(wt.id as keyof typeof WIDGETS)}
              title={wt.label}
            >
              <span className="widget-icon">+</span>
              <span className="widget-label">{wt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedWidgetId && (
        <div className="toolbar-section">
          <h3 className="toolbar-title">Acciones</h3>
          <div className="action-buttons">
            <button
              className="action-btn duplicate-btn"
              onClick={handleDuplicateWidget}
            >
              Duplicar
            </button>
            <button
              className="action-btn delete-btn"
              onClick={handleDeleteWidget}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
