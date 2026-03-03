import { useCallback, useEffect, useRef, useState } from 'react'
import type { GridWidget } from '@/types/layout'

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface UseSaveControllerOptions {
  pageId: string
  setDirty: (dirty: boolean) => void
  setError: (error: string | null) => void
  debounceMs?: number
}

interface UseSaveControllerReturn {
  isSaving: boolean
  saveState: SaveState
  saveStateText: string
  scheduleAutoSave: (widgets: GridWidget[]) => void
  saveNow: (widgets: GridWidget[]) => Promise<void>
  clearTimers: () => void
}

export function useSaveController({
  pageId,
  setDirty,
  setError,
  debounceMs = 2000,
}: UseSaveControllerOptions): UseSaveControllerReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeSaveRef = useRef(false)
  const queuedWidgetsRef = useRef<GridWidget[] | null>(null)

  const persistWidgets = useCallback(
    async (widgets: GridWidget[]) => {
      const response = await fetch(`/api/paginas/${pageId}/grid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el layout')
      }
    },
    [pageId]
  )

  const processSave = useCallback(
    async (widgets: GridWidget[]) => {
      if (activeSaveRef.current) {
        queuedWidgetsRef.current = widgets
        setSaveState('pending')
        return
      }

      activeSaveRef.current = true
      setIsSaving(true)
      setSaveState('saving')

      try {
        let widgetsToSave: GridWidget[] | null = widgets

        while (widgetsToSave) {
          await persistWidgets(widgetsToSave)

          if (queuedWidgetsRef.current) {
            widgetsToSave = queuedWidgetsRef.current
            queuedWidgetsRef.current = null
            continue
          }

          widgetsToSave = null
        }

        setDirty(false)
        setError(null)

        setSaveState('saved')
        if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current)
        saveStateTimerRef.current = setTimeout(() => {
          setSaveState('idle')
        }, 1200)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar'
        setError(message)
        setSaveState('error')
      } finally {
        activeSaveRef.current = false
        setIsSaving(false)
      }
    },
    [persistWidgets, setDirty, setError]
  )

  const scheduleAutoSave = useCallback(
    (widgets: GridWidget[]) => {
      setSaveState('pending')
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

      autoSaveTimerRef.current = setTimeout(() => {
        void processSave(widgets)
      }, debounceMs)
    },
    [debounceMs, processSave]
  )

  const saveNow = useCallback(
    async (widgets: GridWidget[]) => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      await processSave(widgets)
    },
    [processSave]
  )

  const clearTimers = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }

    if (saveStateTimerRef.current) {
      clearTimeout(saveStateTimerRef.current)
      saveStateTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const saveStateText =
    saveState === 'saving'
      ? 'Guardando...'
      : saveState === 'saved'
        ? 'Guardado'
        : saveState === 'error'
          ? 'Error al guardar'
          : saveState === 'pending'
            ? 'Cambios pendientes'
            : 'Sin cambios'

  return {
    isSaving,
    saveState,
    saveStateText,
    scheduleAutoSave,
    saveNow,
    clearTimers,
  }
}
