import { create } from 'zustand'

export type EditorLeftTab = 'pages' | 'ui' | 'data'
export type EditorDataTab = 'queries' | 'js'

interface EditorUiState {
  selectedWidgetId: string | null
  leftTab: EditorLeftTab
  dataTab: EditorDataTab
  uiFilter: string

  setSelectedWidget: (widgetId: string | null) => void
  setLeftTab: (tab: EditorLeftTab) => void
  setDataTab: (tab: EditorDataTab) => void
  setUiFilter: (value: string) => void

  clearSelection: () => void
  resetPanelState: () => void
}

export const useEditorUiStore = create<EditorUiState>((set) => ({
  selectedWidgetId: null,
  leftTab: 'ui',
  dataTab: 'queries',
  uiFilter: '',

  setSelectedWidget: (selectedWidgetId) => set({ selectedWidgetId }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setDataTab: (dataTab) => set({ dataTab }),
  setUiFilter: (uiFilter) => set({ uiFilter }),

  clearSelection: () => set({ selectedWidgetId: null }),
  resetPanelState: () =>
    set({
      leftTab: 'ui',
      dataTab: 'queries',
      uiFilter: '',
    }),
}))
