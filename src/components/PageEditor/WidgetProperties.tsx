'use client'

import React from 'react'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
import { WIDGETS } from '@/widgets/registro'
import './WidgetProperties.css'

export function WidgetProperties() {
  const { layout, updateWidget, removeWidget, moveWidget, resizeWidget } = usePageStore()
  const selectedWidgetId = useEditorUiStore((state) => state.selectedWidgetId)

  const selectedWidget = layout?.widgets.find((w) => w.id === selectedWidgetId)
  const widgetDefinition = selectedWidget
    ? WIDGETS[selectedWidget.type as keyof typeof WIDGETS]
    : null

  if (!selectedWidget) {
    return (
      <div className="widget-properties">
        <div className="properties-empty">
          <p>Selecciona un widget para ver sus propiedades</p>
        </div>
      </div>
    )
  }

  const handleConfigChange = (key: string, value: any) => {
    if (selectedWidget) {
      updateWidget(selectedWidget.id, {
        ...selectedWidget,
        config: {
          ...selectedWidget.config,
          [key]: value,
        },
      })
    }
  }

  const handleDelete = () => {
    if (selectedWidget) {
      removeWidget(selectedWidget.id)
    }
  }

  const renderSchemaField = (field: any) => {
    if (!selectedWidget) return null

    const value =
      selectedWidget.config?.[field.campo] ??
      widgetDefinition?.porDefecto?.[field.campo as keyof typeof widgetDefinition.porDefecto] ??
      ''

    if (field.tipo === 'expresion') {
      return (
        <textarea
          value={String(value)}
          onChange={(e) => handleConfigChange(field.campo, e.target.value)}
          className="property-textarea"
          placeholder={field.placeholder || ''}
          rows={4}
        />
      )
    }

    if (field.tipo === 'selector') {
      return (
        <select
          value={String(value)}
          onChange={(e) => handleConfigChange(field.campo, e.target.value)}
          className="property-select"
        >
          {field.opciones?.map((option: any) => (
            <option key={option.valor} value={option.valor}>
              {option.etiqueta}
            </option>
          ))}
        </select>
      )
    }

    if (field.tipo === 'alineacion') {
      return (
        <div className="align-buttons">
          {[
            { value: 'left', label: 'Izq' },
            { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Der' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              className={`align-btn ${value === option.value ? 'active' : ''}`}
              onClick={() => handleConfigChange(field.campo, option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )
    }

    return (
      <input
        type="text"
        value={String(value)}
        onChange={(e) => handleConfigChange(field.campo, e.target.value)}
        className="property-input"
      />
    )
  }

  return (
    <div className="widget-properties">
      <div className="properties-header">
        <h3 className="properties-title">Propiedades</h3>
      </div>

      <div className="properties-content">
        <div className="property-section">
          <h4 className="property-section-title">General</h4>
          <div className="property-group">
            <label className="property-label">ID</label>
            <input
              type="text"
              value={selectedWidget.id}
              disabled
              className="property-input property-input-disabled"
            />
          </div>
          <div className="property-group">
            <label className="property-label">Tipo</label>
            <input
              type="text"
              value={selectedWidget.type}
              disabled
              className="property-input property-input-disabled"
            />
          </div>
        </div>

        <div className="property-section">
          <h4 className="property-section-title">Layout</h4>
          <div className="property-group">
            <label className="property-label">Posición X</label>
            <input
              type="number"
              value={selectedWidget.x}
              min={0}
              max={11}
              onChange={(e) =>
                moveWidget(
                  selectedWidget.id,
                  Math.max(0, Number(e.target.value) || 0),
                  selectedWidget.y
                )
              }
              className="property-input"
            />
          </div>
          <div className="property-group">
            <label className="property-label">Posición Y</label>
            <input
              type="number"
              value={selectedWidget.y}
              min={0}
              onChange={(e) =>
                moveWidget(
                  selectedWidget.id,
                  selectedWidget.x,
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
              className="property-input"
            />
          </div>
          <div className="property-group">
            <label className="property-label">Ancho</label>
            <input
              type="number"
              value={selectedWidget.w}
              min={1}
              max={12}
              onChange={(e) =>
                resizeWidget(
                  selectedWidget.id,
                  Math.min(12, Math.max(1, Number(e.target.value) || 1)),
                  selectedWidget.h
                )
              }
              className="property-input"
            />
          </div>
          <div className="property-group">
            <label className="property-label">Alto</label>
            <input
              type="number"
              value={selectedWidget.h}
              min={1}
              onChange={(e) =>
                resizeWidget(
                  selectedWidget.id,
                  selectedWidget.w,
                  Math.max(1, Number(e.target.value) || 1)
                )
              }
              className="property-input"
            />
          </div>
        </div>

        <div className="property-section">
          <h4 className="property-section-title">Configuración</h4>
          {widgetDefinition?.schema?.map((field: any) => (
            <div className="property-group" key={field.campo}>
              <label className="property-label">{field.etiqueta}</label>
              {renderSchemaField(field)}
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="properties-actions">
        <button className="delete-btn-small" onClick={handleDelete}>
          Eliminar Widget
        </button>
      </div>
    </div>
  )
}
