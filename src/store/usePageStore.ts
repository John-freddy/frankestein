import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { GridWidget, PageLayout, LayoutChangeEvent } from '@/types/layout'

/**
 * Store global para manejo del estado de la página/layout
 */
interface PageStoreState {
  // Estado
  layout: PageLayout | null
  isLoading: boolean
  error: string | null
  isDirty: boolean  // si hay cambios sin guardar

  // Acciones
  setLayout: (layout: PageLayout) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDirty: (dirty: boolean) => void

  // CRUD de widgets
  addWidget: (widget: GridWidget) => void
  removeWidget: (widgetId: string) => void
  updateWidget: (widgetId: string, updates: Partial<GridWidget>) => void
  duplicateWidget: (widgetId: string) => void

  // Manejo de layout/posiciones
  updateLayoutPositions: (changes: LayoutChangeEvent) => void
  moveWidget: (widgetId: string, x: number, y: number) => void
  resizeWidget: (widgetId: string, w: number, h: number) => void

  // Operaciones
  resetLayout: () => void
  clearWidgetConfig: (widgetId: string) => void
}

export const usePageStore = create<PageStoreState>()(
  devtools((set, get) => ({
        // Estado inicial
        layout: null,
        isLoading: false,
        error: null,
        isDirty: false,

        // Setters básicos
        setLayout: (layout) => {
          set({ layout, isDirty: false })
        },

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),

        setDirty: (isDirty) => set({ isDirty }),

        // Agregar widget
        addWidget: (widget) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: [...state.layout.widgets, widget],
              },
              isDirty: true,
            }
          })
        },

        // Eliminar widget
        removeWidget: (widgetId) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: state.layout.widgets.filter((w) => w.id !== widgetId),
              },
              isDirty: true,
            }
          })
        },

        // Actualizar widget
        updateWidget: (widgetId, updates) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: state.layout.widgets.map((w) =>
                  w.id === widgetId
                    ? {
                        ...w,
                        ...updates,
                        updatedAt: new Date(),
                      }
                    : w
                ),
              },
              isDirty: true,
            }
          })
        },

        // Duplicar widget
        duplicateWidget: (widgetId) => {
          const state = get()
          if (!state.layout) return

          const original = state.layout.widgets.find((w) => w.id === widgetId)
          if (!original) return

          const duplicate: GridWidget = {
            ...original,
            id: `${original.id}-copy-${Date.now()}`,
            x: original.x + 1 > 6 ? 0 : original.x + 1,
            y: original.y + original.h + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          set((state) => ({
            layout: state.layout
              ? {
                  ...state.layout,
                  widgets: [...state.layout.widgets, duplicate],
                }
              : null,
            isDirty: true,
          }))
        },

        // Actualizar múltiples posiciones de una vez (al dragear)
        updateLayoutPositions: (changes) => {
          set((state) => {
            if (!state.layout) return state

            const updatedWidgets = state.layout.widgets.map((widget) => {
              const change = changes.layout.find((c) => c.widgetId === widget.id)
              if (change) {
                return {
                  ...widget,
                  x: change.x,
                  y: change.y,
                  w: change.w,
                  h: change.h,
                  updatedAt: new Date(),
                }
              }
              return widget
            })

            return {
              layout: {
                ...state.layout,
                widgets: updatedWidgets,
              },
              isDirty: true,
            }
          })
        },

        // Mover widget
        moveWidget: (widgetId, x, y) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: state.layout.widgets.map((w) =>
                  w.id === widgetId
                    ? { ...w, x, y, updatedAt: new Date() }
                    : w
                ),
              },
              isDirty: true,
            }
          })
        },

        // Redimensionar widget
        resizeWidget: (widgetId, w, h) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: state.layout.widgets.map((widget) =>
                  widget.id === widgetId
                    ? { ...widget, w, h, updatedAt: new Date() }
                    : widget
                ),
              },
              isDirty: true,
            }
          })
        },

        // Resetear layout
        resetLayout: () => {
          set({ layout: null, isDirty: false })
        },

        // Limpiar config de widget
        clearWidgetConfig: (widgetId) => {
          set((state) => {
            if (!state.layout) return state
            return {
              layout: {
                ...state.layout,
                widgets: state.layout.widgets.map((w) =>
                  w.id === widgetId
                    ? { ...w, config: {}, updatedAt: new Date() }
                    : w
                ),
              },
              isDirty: true,
            }
          })
        },
      }))
)
