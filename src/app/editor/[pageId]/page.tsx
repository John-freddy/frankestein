'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GridCanvas } from '@/components/PageEditor/GridCanvas'
import { WidgetToolbar } from '@/components/PageEditor/WidgetToolbar'
import { WidgetProperties } from '@/components/PageEditor/WidgetProperties'
import { usePageStore } from '@/store/usePageStore'
import { useSaveController } from '@/hooks/useSaveController'
import type { PageLayout } from '@/types/layout'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string

  const {
    layout,
    setLayout,
    setLoading,
    setError,
    error,
    isDirty,
    setDirty,
  } = usePageStore()

  const { isSaving, saveState, saveStateText, scheduleAutoSave, saveNow } = useSaveController({
    pageId,
    setDirty,
    setError,
    debounceMs: 2000,
  })

  // Cargar layout inicial
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/paginas/${pageId}/grid`)

        if (!res.ok) throw new Error('Error al cargar el layout')

        const data: PageLayout = await res.json()
        setLayout(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchLayout()
  }, [pageId, setLayout, setLoading, setError])

  // Guardado automático para cambios de propiedades/layout
  useEffect(() => {
    if (!layout || !isDirty) return

    scheduleAutoSave(layout.widgets)
  }, [layout, isDirty, scheduleAutoSave])

  // Guardado manual (botón Guardar)
  const handleManualSave = () => {
    if (!layout?.widgets) return
    void saveNow(layout.widgets)
  }

  // Prevenir salida si hay cambios
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () =>
      window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return (
    <div className="editor-page">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-header-left">
          <h1 className="editor-title">Editor de Página</h1>
          {isDirty && <span className="unsaved-indicator">●</span>}
        </div>

        <div className="editor-header-right">
          <span
            className={`save-state-badge save-state-${saveState}`}
            aria-live="polite"
          >
            {saveStateText}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleManualSave}
            disabled={!layout || !isDirty || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {/* Canvas */}
      <div className="editor-content">
          <WidgetToolbar />
        <GridCanvas
          isEditing={true}
          maxWidth={1400}
        />
        <WidgetProperties />
      </div>
    </div>
  )
}
