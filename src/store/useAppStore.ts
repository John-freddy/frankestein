import { create } from 'zustand'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
}

interface AppState {
  // Estado global del usuario
  usuario: Usuario | null
  token: string | null

  // Variables de página (clave = pageId, valor = objeto de variables)
  pageVars: Record<string, Record<string, unknown>>

  // Acciones — usuario
  setUsuario: (usuario: Usuario | null) => void
  setToken: (token: string | null) => void

  // Acciones — variables de página
  setPageVar: (pageId: string, key: string, value: unknown) => void
  getPageVar: (pageId: string, key: string) => unknown
  clearPageVars: (pageId: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  usuario: null,
  token: null,
  pageVars: {},

  setUsuario: (usuario) => set({ usuario }),
  setToken: (token) => set({ token }),

  setPageVar: (pageId, key, value) =>
    set((state) => ({
      pageVars: {
        ...state.pageVars,
        [pageId]: {
          ...(state.pageVars[pageId] ?? {}),
          [key]: value,
        },
      },
    })),

  getPageVar: (pageId, key) => {
    const state = get()
    return state.pageVars[pageId]?.[key]
  },

  clearPageVars: (pageId) =>
    set((state) => {
      const updated = { ...state.pageVars }
      delete updated[pageId]
      return { pageVars: updated }
    }),
}))