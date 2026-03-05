'use client'

import React, { Suspense, useMemo } from 'react'
import type { GridWidget } from '@/types/layout'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
import { useAppStore } from '@/store/useAppStore'
import { buildContexto, evaluarExpresion } from '@/lib/expresiones'
import { WidgetTexto } from '@/widgets/texto'
import { textoPorDefecto, type TextoConfig } from '@/widgets/texto/config'

const EMPTY_PAGE_VARS: Record<string, unknown> = {}
const EMPTY_QUERY_RESULTS: Record<string, unknown> = {}

export interface WidgetRendererProps {
  /** Widget a renderizar */
  widget: GridWidget

  /** Si está en modo edición */
  isEditing: boolean
}

/**
 * Componente que renderiza un widget dinámicamente
 */
export function WidgetRenderer({ widget, isEditing }: WidgetRendererProps) {
  const layout = usePageStore((state) => state.layout)
  const removeWidget = usePageStore((state) => state.removeWidget)
  const selectedWidgetId = useEditorUiStore((state) => state.selectedWidgetId)
  const setSelectedWidget = useEditorUiStore((state) => state.setSelectedWidget)
  const usuario = useAppStore((state) => state.usuario)
  const pageVarsFromStore = useAppStore((state) =>
    layout?.id ? state.pageVars[layout.id] : undefined
  )
  const queryResultsFromStore = useAppStore((state) =>
    layout?.id ? state.queryResultsByPage[layout.id] : undefined
  )
  const pageVars = pageVarsFromStore ?? EMPTY_PAGE_VARS
  const queryResults = queryResultsFromStore ?? EMPTY_QUERY_RESULTS
  const isSelected = selectedWidgetId === widget.id

  const contexto = useMemo(
    () =>
      buildContexto({
        usuario,
        pageVars,
        queryResults,
      }),
    [usuario, pageVars, queryResults]
  )

  // Para ahora, mostrar un placeholder simple
  // En futuro, aquí se integraría con el registro de widgets dinámicos
  const renderWidget = () => {
    switch (widget.type) {
      case 'texto':
        const rawConfig = (widget.config ?? {}) as Partial<TextoConfig>
        const contenidoEvaluado = evaluarExpresion(
          String(rawConfig.contenido ?? textoPorDefecto.contenido),
          contexto
        )
        const textConfig: TextoConfig = {
          ...textoPorDefecto,
          ...rawConfig,
          contenido: contenidoEvaluado,
        }

        return (
          <div className="widget-content">
            <WidgetTexto config={textConfig} />
          </div>
        )
      case 'input':
        return (
          <div className="widget-content">
            <input
              type="text"
              placeholder={widget.config?.placeholder || 'Ingresa algo...'}
              defaultValue={widget.config?.value || ''}
              readOnly={!isEditing}
            />
          </div>
        )
      default:
        return (
          <div className="widget-content">
            <p>Widget tipo: {widget.type}</p>
          </div>
        )
    }
  }

  return (
    <div
      className={`widget-wrapper ${isEditing ? 'editable' : ''} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={() => isEditing && setSelectedWidget(widget.id)}
      role="region"
      aria-label={`Widget: ${widget.type}`}
    >
      <Suspense
        fallback={
          <div className="widget-loading">
            <div className="spinner"></div>
            <span>Cargando...</span>
          </div>
        }
      >
        {isEditing && <div className="widget-drag-handle">⋮⋮ Arrastrar</div>}
        {renderWidget()}
      </Suspense>

      {isEditing && isSelected && (
        <div className="widget-selection-frame">
          <button
            className="widget-close-btn"
            onClick={() => removeWidget(widget.id)}
            title="Eliminar widget"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
