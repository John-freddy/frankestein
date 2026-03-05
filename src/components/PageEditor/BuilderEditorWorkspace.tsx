'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { GridCanvas } from '@/components/PageEditor/GridCanvas'
import { WidgetProperties } from '@/components/PageEditor/WidgetProperties'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
import { useAppStore } from '@/store/useAppStore'
import { useSaveController } from '@/hooks/useSaveController'
import type { GridWidget, PageLayout } from '@/types/layout'
import { WIDGETS } from '@/widgets/registro'

interface BuilderEditorWorkspaceProps {
  appId: string
  appSlug: string
  appNombre: string
  pageId: string
  pageNombre: string
  pageUrl: string
}

interface PageSummary {
  id: string
  nombre: string
  url: string
  esInicio: boolean
  isPublished?: boolean
}

interface PageQueryResource {
  id: string
  nombre: string
  fuenteId: string
  ejecutarAlCargar: boolean
  config?: {
    method?: string
    path?: string
  }
  fuente: {
    nombre: string
    tipo: string
  }
}

interface DataSourceSummary {
  id: string
  nombre: string
  tipo: string
}

interface JsObjectResource {
  id: string
  nombre: string
  codigo: string
  ejecutarAlCargar: boolean
}

interface QueryRunResult {
  ok: boolean
  status: number | null
  durationMs: number
  executedAt: string
  data?: unknown
  error?: string
}

export default function BuilderEditorWorkspace({
  appId,
  appSlug,
  appNombre,
  pageId,
  pageNombre,
  pageUrl,
}: BuilderEditorWorkspaceProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    layout,
    isLoading,
    setLayout,
    setLoading,
    setError,
    error,
    isDirty,
    setDirty,
    resetLayout,
    addWidget,
    duplicateWidget,
    removeWidget,
  } = usePageStore()
  const {
    selectedWidgetId,
    leftTab,
    dataTab,
    uiFilter,
    setSelectedWidget,
    setLeftTab,
    setDataTab,
    setUiFilter,
    clearSelection,
  } = useEditorUiStore()
  const setPageQueryResult = useAppStore((state) => state.setPageQueryResult)
  const clearPageQueryResults = useAppStore((state) => state.clearPageQueryResults)

  const { isSaving, saveStateText, scheduleAutoSave, saveNow } = useSaveController({
    pageId,
    setDirty,
    setError,
    debounceMs: 2000,
  })
  const [queriesLoading, setQueriesLoading] = useState(false)
  const [queriesError, setQueriesError] = useState<string | null>(null)
  const [queries, setQueries] = useState<PageQueryResource[]>([])
  const [dataSources, setDataSources] = useState<DataSourceSummary[]>([])
  const [queryFormMode, setQueryFormMode] = useState<'create' | 'edit'>('create')
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null)
  const [queryName, setQueryName] = useState('')
  const [querySourceId, setQuerySourceId] = useState('')
  const [queryMethod, setQueryMethod] = useState('GET')
  const [queryPath, setQueryPath] = useState('')
  const [queryRunOnLoad, setQueryRunOnLoad] = useState(false)
  const [queryFormError, setQueryFormError] = useState<string | null>(null)
  const [querySaving, setQuerySaving] = useState(false)
  const [queryFilter, setQueryFilter] = useState('')
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null)
  const [queryRunResults, setQueryRunResults] = useState<Record<string, QueryRunResult>>({})
  const [jsLoading, setJsLoading] = useState(false)
  const [jsError, setJsError] = useState<string | null>(null)
  const [jsObjects, setJsObjects] = useState<JsObjectResource[]>([])
  const [jsFormMode, setJsFormMode] = useState<'create' | 'edit'>('create')
  const [editingJsId, setEditingJsId] = useState<string | null>(null)
  const [jsName, setJsName] = useState('')
  const [jsCode, setJsCode] = useState('')
  const [jsRunOnLoad, setJsRunOnLoad] = useState(false)
  const [jsFormError, setJsFormError] = useState<string | null>(null)
  const [jsSaving, setJsSaving] = useState(false)
  const [jsFilter, setJsFilter] = useState('')
  const [pagesLoading, setPagesLoading] = useState(true)
  const [pagesError, setPagesError] = useState<string | null>(null)
  const [pages, setPages] = useState<PageSummary[]>([])
  const [newPageName, setNewPageName] = useState('')
  const [creatingPage, setCreatingPage] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [selectedPageUrl, setSelectedPageUrl] = useState(pageUrl)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editingPageName, setEditingPageName] = useState('')
  const [editingPageUrl, setEditingPageUrl] = useState('')
  const [pageActionLoadingId, setPageActionLoadingId] = useState<string | null>(null)
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null)

  const canvasAreaRef = useRef<HTMLElement | null>(null)
  const urlStateReadyRef = useRef(false)
  const hasLoadedQueriesRef = useRef(false)
  const hasLoadedSourcesRef = useRef(false)
  const hasLoadedJsRef = useRef(false)
  const searchParamsString = searchParams.toString()

  const resetQueryForm = useCallback(() => {
    setQueryFormMode('create')
    setEditingQueryId(null)
    setQueryName('')
    setQueryMethod('GET')
    setQueryPath('')
    setQueryRunOnLoad(false)
    setQueryFormError(null)
  }, [])

  const loadQueries = useCallback(async () => {
    try {
      setQueriesLoading(true)
      setQueriesError(null)

      const res = await fetch(`/api/paginas/${pageId}/queries`)
      if (!res.ok) throw new Error('Error al cargar queries')

      const data: PageQueryResource[] = await res.json()
      setQueries(Array.isArray(data) ? data : [])
      hasLoadedQueriesRef.current = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar queries'
      setQueriesError(message)
    } finally {
      setQueriesLoading(false)
    }
  }, [pageId])

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/aplicaciones/${appId}/fuentes`)
      if (!res.ok) throw new Error('Error al cargar fuentes de datos')

      const data: DataSourceSummary[] = await res.json()
      const sources = Array.isArray(data) ? data : []
      setDataSources(sources)
      hasLoadedSourcesRef.current = true

      setQuerySourceId((current) => {
        if (current) return current
        return sources[0]?.id ?? ''
      })
    } catch {
      setDataSources([])
    }
  }, [appId])

  const resetJsForm = useCallback(() => {
    setJsFormMode('create')
    setEditingJsId(null)
    setJsName('')
    setJsCode('')
    setJsRunOnLoad(false)
    setJsFormError(null)
  }, [])

  const loadJsObjects = useCallback(async () => {
    try {
      setJsLoading(true)
      setJsError(null)

      const res = await fetch(`/api/paginas/${pageId}/js-objects`)
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: '' }))
        throw new Error(errorBody.error || 'Error al cargar objetos JS')
      }

      const data: JsObjectResource[] = await res.json()
      setJsObjects(Array.isArray(data) ? data : [])
      hasLoadedJsRef.current = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar objetos JS'
      setJsError(message)
    } finally {
      setJsLoading(false)
    }
  }, [pageId])

  const handleEditJsObject = (jsObject: JsObjectResource) => {
    setJsFormMode('edit')
    setEditingJsId(jsObject.id)
    setJsName(jsObject.nombre)
    setJsCode(jsObject.codigo)
    setJsRunOnLoad(jsObject.ejecutarAlCargar)
    setJsFormError(null)
  }

  const handleDeleteJsObject = async (jsId: string) => {
    try {
      const res = await fetch(`/api/js-objects/${jsId}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: '' }))
        throw new Error(errorBody.error || 'No se pudo eliminar el objeto JS')
      }

      if (editingJsId === jsId) {
        resetJsForm()
      }

      await loadJsObjects()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar objeto JS'
      setJsError(message)
    }
  }

  const handleSaveJsObject = async () => {
    if (!jsName.trim()) {
      setJsFormError('El nombre es requerido')
      return
    }

    try {
      setJsSaving(true)
      setJsFormError(null)

      const payload = {
        nombre: jsName.trim(),
        codigo: jsCode,
        ejecutarAlCargar: jsRunOnLoad,
      }

      const endpoint = jsFormMode === 'edit' && editingJsId
        ? `/api/js-objects/${editingJsId}`
        : `/api/paginas/${pageId}/js-objects`

      const method = jsFormMode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: '' }))
        throw new Error(errorBody.error || 'No se pudo guardar el objeto JS')
      }

      resetJsForm()
      await loadJsObjects()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar objeto JS'
      setJsFormError(message)
    } finally {
      setJsSaving(false)
    }
  }

  const handleEditQuery = (queryItem: PageQueryResource) => {
    setQueryFormMode('edit')
    setEditingQueryId(queryItem.id)
    setQueryName(queryItem.nombre)
    setQuerySourceId(queryItem.fuenteId)
    setQueryMethod(String(queryItem.config?.method ?? 'GET').toUpperCase())
    setQueryPath(String(queryItem.config?.path ?? ''))
    setQueryRunOnLoad(queryItem.ejecutarAlCargar)
    setQueryFormError(null)
  }

  const handleDeleteQuery = async (queryId: string) => {
    try {
      const res = await fetch(`/api/queries/${queryId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar la query')

      if (editingQueryId === queryId) {
        resetQueryForm()
      }

      await loadQueries()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar query'
      setQueriesError(message)
    }
  }

  const handleSaveQuery = async () => {
    if (!queryName.trim()) {
      setQueryFormError('El nombre es requerido')
      return
    }

    if (!querySourceId) {
      setQueryFormError('Selecciona una fuente de datos')
      return
    }

    try {
      setQuerySaving(true)
      setQueryFormError(null)

      const payload = {
        nombre: queryName.trim(),
        fuenteId: querySourceId,
        ejecutarAlCargar: queryRunOnLoad,
        method: queryMethod,
        path: queryPath,
      }

      const endpoint = queryFormMode === 'edit' && editingQueryId
        ? `/api/queries/${editingQueryId}`
        : `/api/paginas/${pageId}/queries`

      const method = queryFormMode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: '' }))
        throw new Error(errorBody.error || 'No se pudo guardar la query')
      }

      resetQueryForm()
      await loadQueries()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar query'
      setQueryFormError(message)
    } finally {
      setQuerySaving(false)
    }
  }

  const handleRunQuery = async (queryId: string) => {
    const queryItem = queries.find((item) => item.id === queryId)
    const queryName = queryItem?.nombre

    try {
      setRunningQueryId(queryId)

      const startedAt = Date.now()
      const res = await fetch(`/api/queries/${queryId}/ejecutar`, {
        method: 'POST',
      })

      const payload = await res.json().catch(() => ({}))
      const durationMs = Date.now() - startedAt

      if (!res.ok) {
        const failedResult: QueryRunResult = {
          ok: false,
          status: typeof payload?.status === 'number' ? payload.status : res.status,
          durationMs,
          executedAt: new Date().toISOString(),
          error: payload?.error || 'Error al ejecutar query',
        }

        setQueryRunResults((prev) => ({
          ...prev,
          [queryId]: failedResult,
        }))

        if (queryName) {
          setPageQueryResult(pageId, queryName, failedResult)
        }

        return
      }

      const successResult: QueryRunResult = {
        ok: true,
        status: typeof payload?.status === 'number' ? payload.status : 200,
        durationMs,
        executedAt: new Date().toISOString(),
        data: payload?.data,
      }

      setQueryRunResults((prev) => ({
        ...prev,
        [queryId]: successResult,
      }))

      if (queryName) {
        setPageQueryResult(pageId, queryName, successResult)
      }
    } catch (error) {
      const failedResult: QueryRunResult = {
        ok: false,
        status: null,
        durationMs: 0,
        executedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error al ejecutar query',
      }

      setQueryRunResults((prev) => ({
        ...prev,
        [queryId]: failedResult,
      }))

      if (queryName) {
        setPageQueryResult(pageId, queryName, failedResult)
      }
    } finally {
      setRunningQueryId(null)
    }
  }

  useEffect(() => {
    clearPageQueryResults(pageId)
  }, [pageId, clearPageQueryResults])

  useEffect(() => {
    setSelectedPageUrl(pageUrl)
  }, [pageUrl])

  useEffect(() => {
    if (pages.length === 0) return
    const stillExists = pages.some((page) => page.url === selectedPageUrl)
    if (!stillExists) {
      setSelectedPageUrl(pageUrl)
    }
  }, [pages, selectedPageUrl, pageUrl])

  useEffect(() => {
    resetLayout()
    clearSelection()
    setUiFilter('')
    resetQueryForm()
    resetJsForm()
    hasLoadedQueriesRef.current = false
    hasLoadedSourcesRef.current = false
    hasLoadedJsRef.current = false
    setQueries([])
    setDataSources([])
    setJsObjects([])
    setQueryRunResults({})
  }, [pageId, resetLayout, clearSelection, setUiFilter, resetQueryForm, resetJsForm])

  useEffect(() => {
    const timer = setTimeout(() => {
      canvasAreaRef.current?.focus()
    }, 0)

    return () => clearTimeout(timer)
  }, [pageId])

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString)
    const tabParam = urlParams.get('tab')
    const dataTabParam = urlParams.get('dataTab')
    const { leftTab: currentLeftTab, dataTab: currentDataTab } = useEditorUiStore.getState()

    if (!urlStateReadyRef.current) {
      const initialTab: 'pages' | 'ui' | 'data' =
        tabParam === 'pages' || tabParam === 'ui' || tabParam === 'data'
          ? tabParam
          : 'ui'

      const initialDataTab: 'queries' | 'js' =
        dataTabParam === 'js' ? 'js' : 'queries'

      if (currentLeftTab !== initialTab) {
        setLeftTab(initialTab)
      }

      if (currentDataTab !== initialDataTab) {
        setDataTab(initialDataTab)
      }

      urlStateReadyRef.current = true
      return
    }

    if (
      tabParam &&
      (tabParam === 'pages' || tabParam === 'ui' || tabParam === 'data') &&
      currentLeftTab !== tabParam
    ) {
      setLeftTab(tabParam)
    }

    if (
      dataTabParam &&
      (dataTabParam === 'queries' || dataTabParam === 'js') &&
      currentDataTab !== dataTabParam
    ) {
      setDataTab(dataTabParam)
    }
  }, [searchParamsString, setLeftTab, setDataTab])

  useEffect(() => {
    if (!urlStateReadyRef.current) return

    const currentQuery = searchParamsString
    const nextQueryParams = new URLSearchParams(currentQuery)

    if (leftTab === 'ui') {
      nextQueryParams.delete('tab')
    } else {
      nextQueryParams.set('tab', leftTab)
    }

    if (leftTab === 'data') {
      nextQueryParams.set('dataTab', dataTab)
    } else {
      nextQueryParams.delete('dataTab')
    }

    const nextQuery = nextQueryParams.toString()
    if (nextQuery === currentQuery) return

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(nextUrl)
  }, [leftTab, dataTab, pathname, router, searchParamsString])

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/paginas/${pageId}/grid`)

        if (!res.ok) throw new Error('Error al cargar el layout')

        const data: PageLayout = await res.json()
        if (data && Array.isArray(data.widgets)) {
          setLayout(data)
        } else {
          setLayout({ id: pageId, name: pageNombre, widgets: [] })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
        setLayout({ id: pageId, name: pageNombre, widgets: [] })
      } finally {
        setLoading(false)
      }
    }

    void fetchLayout()
  }, [pageId, pageNombre, setError, setLayout, setLoading])

  useEffect(() => {
    if (leftTab !== 'data') return

    if (dataTab === 'queries') {
      if (!hasLoadedQueriesRef.current) {
        void loadQueries()
      }
      if (!hasLoadedSourcesRef.current) {
        void loadSources()
      }
      return
    }

    if (!hasLoadedJsRef.current) {
      void loadJsObjects()
    }
  }, [leftTab, dataTab, loadQueries, loadSources, loadJsObjects])

  useEffect(() => {
    const fetchPages = async () => {
      try {
        setPagesLoading(true)
        setPagesError(null)

        const res = await fetch(`/api/aplicaciones/${appId}/paginas`)
        if (!res.ok) throw new Error('Error al cargar páginas')

        const data: PageSummary[] = await res.json()
        setPages(Array.isArray(data) ? data : [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar páginas'
        setPagesError(message)
      } finally {
        setPagesLoading(false)
      }
    }

    void fetchPages()
  }, [appId, pageId])

  useEffect(() => {
    if (!layout || !isDirty) return

    scheduleAutoSave(layout.widgets)
  }, [isDirty, layout, scheduleAutoSave])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const handleManualSave = () => {
    if (!layout?.widgets) return
    void saveNow(layout.widgets)
  }

  const handlePreviewPage = () => {
    window.open(`/app/${appSlug}/${pageUrl}`, '_blank', 'noopener,noreferrer')
  }

  const handlePublishPage = async () => {
    if (!layout?.widgets) return

    try {
      setPublishing(true)
      setError(null)

      if (isDirty) {
        await saveNow(layout.widgets)
      }

      const publishPageRes = await fetch(`/api/paginas/${pageId}/publicar`, {
        method: 'POST',
      })

      if (!publishPageRes.ok) {
        const body = await publishPageRes.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo publicar la página')
      }

      const publishAppRes = await fetch(`/api/aplicaciones/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicada: true }),
      })

      if (!publishAppRes.ok) {
        const body = await publishAppRes.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'La página se publicó, pero no se pudo publicar la app')
      }

      const refreshedPagesRes = await fetch(`/api/aplicaciones/${appId}/paginas`)
      if (refreshedPagesRes.ok) {
        const refreshedPages: PageSummary[] = await refreshedPagesRes.json()
        setPages(Array.isArray(refreshedPages) ? refreshedPages : [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al publicar'
      setError(message)
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublishPage = async () => {
    try {
      setPublishing(true)
      setError(null)

      const unpublishPageRes = await fetch(`/api/paginas/${pageId}/despublicar`, {
        method: 'POST',
      })

      if (!unpublishPageRes.ok) {
        const body = await unpublishPageRes.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo despublicar la página')
      }

      const refreshedPagesRes = await fetch(`/api/aplicaciones/${appId}/paginas`)
      if (refreshedPagesRes.ok) {
        const refreshedPages: PageSummary[] = await refreshedPagesRes.json()
        setPages(Array.isArray(refreshedPages) ? refreshedPages : [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al despublicar'
      setError(message)
    } finally {
      setPublishing(false)
    }
  }

  const orderedWidgets = useMemo(
    () =>
      [...(layout?.widgets ?? [])].sort(
        (firstWidget, secondWidget) =>
          firstWidget.y - secondWidget.y || firstWidget.x - secondWidget.x
      ),
    [layout?.widgets]
  )
  const currentPage = useMemo(
    () => pages.find((page) => page.id === pageId),
    [pages, pageId]
  )
  const isCurrentPagePublished = Boolean(currentPage?.isPublished)

  const filteredWidgets = useMemo(
    () =>
      orderedWidgets.filter((widget) => {
        if (!uiFilter.trim()) return true

        const filterValue = uiFilter.toLowerCase()
        const widgetLabel = WIDGETS[widget.type as keyof typeof WIDGETS]?.etiqueta ?? widget.type

        return (
          widget.id.toLowerCase().includes(filterValue) ||
          widget.type.toLowerCase().includes(filterValue) ||
          widgetLabel.toLowerCase().includes(filterValue)
        )
      }),
    [orderedWidgets, uiFilter]
  )

  const filteredQueries = useMemo(
    () =>
      queries.filter((queryItem) => {
        if (!queryFilter.trim()) return true

        const filterValue = queryFilter.toLowerCase()
        const method = String(queryItem.config?.method ?? 'GET').toLowerCase()
        const path = String(queryItem.config?.path ?? '').toLowerCase()

        return (
          queryItem.nombre.toLowerCase().includes(filterValue) ||
          queryItem.fuente.nombre.toLowerCase().includes(filterValue) ||
          method.includes(filterValue) ||
          path.includes(filterValue)
        )
      }),
    [queries, queryFilter]
  )

  const filteredJsObjects = useMemo(
    () =>
      jsObjects.filter((jsObject) => {
        if (!jsFilter.trim()) return true
        return jsObject.nombre.toLowerCase().includes(jsFilter.toLowerCase())
      }),
    [jsObjects, jsFilter]
  )

  const selectedWidget = layout?.widgets.find((widget) => widget.id === selectedWidgetId) ?? null

  useEffect(() => {
    if (!selectedWidgetId) return
    if (!layout) return

    const stillExists = layout.widgets.some((widget) => widget.id === selectedWidgetId)
    if (!stillExists) {
      setSelectedWidget(null)
    }
  }, [layout, selectedWidgetId, setSelectedWidget])

  const handleAddWidget = (widgetType: keyof typeof WIDGETS) => {
    if (!layout) {
      setLayout({ id: pageId, name: pageNombre, widgets: [] })
    }

    const currentLayout = usePageStore.getState().layout
    if (!currentLayout) return

    let x = 0
    let y = 0

    if (currentLayout.widgets.length > 0) {
      const lastWidget = currentLayout.widgets[currentLayout.widgets.length - 1]
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
    setLeftTab('ui')
  }

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return

    try {
      setCreatingPage(true)
      setPagesError(null)

      const res = await fetch(`/api/aplicaciones/${appId}/paginas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newPageName.trim() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo crear la página')
      }

      const page: PageSummary = await res.json()
      setNewPageName('')
      setLeftTab('pages')
      setSelectedPageUrl(page.url)
      await reloadPages()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la página'
      setPagesError(message)
    } finally {
      setCreatingPage(false)
    }
  }

  const buildBuilderUrl = useCallback(
    (targetPageUrl: string, nextTab: 'pages' | 'ui' | 'data') => {
      const nextQueryParams = new URLSearchParams(searchParamsString)

      if (nextTab === 'ui') {
        nextQueryParams.delete('tab')
        nextQueryParams.delete('dataTab')
      } else if (nextTab === 'pages') {
        nextQueryParams.set('tab', 'pages')
        nextQueryParams.delete('dataTab')
      } else {
        nextQueryParams.set('tab', 'data')
        nextQueryParams.set('dataTab', dataTab)
      }

      const nextQuery = nextQueryParams.toString()
      return `/builder/${appSlug}/${targetPageUrl}${nextQuery ? `?${nextQuery}` : ''}`
    },
    [appSlug, dataTab, searchParamsString]
  )

  const handleLeftTabChange = (nextTab: 'pages' | 'ui' | 'data') => {
    if (nextTab === 'pages') {
      setLeftTab('pages')
      return
    }

    const pageExists = pages.some((item) => item.url === selectedPageUrl)
    const targetPageUrl = pageExists ? selectedPageUrl : pageUrl

    if (targetPageUrl !== pageUrl) {
      const targetUrl = buildBuilderUrl(targetPageUrl, nextTab)
      router.push(targetUrl)
      return
    }

    setLeftTab(nextTab)
  }

  const startEditPage = (page: PageSummary) => {
    setEditingPageId(page.id)
    setEditingPageName(page.nombre)
    setEditingPageUrl(page.url)
  }

  const cancelEditPage = () => {
    setEditingPageId(null)
    setEditingPageName('')
    setEditingPageUrl('')
  }

  const reloadPages = async () => {
    const res = await fetch(`/api/aplicaciones/${appId}/paginas`)
    if (!res.ok) throw new Error('No se pudo recargar páginas')
    const pagesData: PageSummary[] = await res.json()
    const safePages = Array.isArray(pagesData) ? pagesData : []
    setPages(safePages)
    return safePages
  }

  const handleUpdatePage = async (page: PageSummary) => {
    if (!editingPageName.trim() || !editingPageUrl.trim()) {
      setPagesError('Nombre y slug son requeridos')
      return
    }

    try {
      setPagesError(null)
      setPageActionLoadingId(page.id)

      const res = await fetch(`/api/paginas/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editingPageName.trim(),
          url: editingPageUrl.trim(),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo actualizar la página')
      }

      const updatedPage: PageSummary = await res.json()
      const refreshedPages = await reloadPages()
      cancelEditPage()

      if (selectedPageUrl === page.url) {
        setSelectedPageUrl(updatedPage.url)
      }

      if (!refreshedPages.some((item) => item.url === selectedPageUrl)) {
        setSelectedPageUrl(updatedPage.url)
      }

      if (updatedPage.id === pageId && updatedPage.url !== page.url) {
        router.replace(`/builder/${appSlug}/${updatedPage.url}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar página'
      setPagesError(message)
    } finally {
      setPageActionLoadingId(null)
    }
  }

  const handleSetHome = async (page: PageSummary) => {
    try {
      setPagesError(null)
      setPageActionLoadingId(page.id)

      const res = await fetch(`/api/paginas/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ esInicio: true }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo definir página inicio')
      }

      await reloadPages()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al definir inicio'
      setPagesError(message)
    } finally {
      setPageActionLoadingId(null)
    }
  }

  const requestDeletePage = (page: PageSummary) => {
    if (pages.length <= 1) {
      setPagesError('No puedes eliminar la última página de la aplicación')
      return
    }

    setPendingDeletePageId(page.id)
  }

  const cancelDeletePage = () => {
    setPendingDeletePageId(null)
  }

  const handleDeletePage = async (page: PageSummary) => {
    if (pages.length <= 1) {
      setPagesError('No puedes eliminar la última página de la aplicación')
      return
    }

    try {
      setPagesError(null)
      setPageActionLoadingId(page.id)

      const res = await fetch(`/api/paginas/${page.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: '' }))
        throw new Error(body.error || 'No se pudo eliminar la página')
      }

      const refreshedPages = await reloadPages()
      setPendingDeletePageId(null)

      if (selectedPageUrl === page.url) {
        setSelectedPageUrl(refreshedPages[0]?.url ?? pageUrl)
      }

      if (page.id === pageId) {
        router.replace(`/builder/${appSlug}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar página'
      setPagesError(message)
    } finally {
      setPageActionLoadingId(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              <Link href="/builder" className="hover:underline">Builder</Link>
              {' / '}
              <Link href={`/builder/${appSlug}`} className="hover:underline">{appNombre}</Link>
              {' / '}
              <span>{pageNombre}</span>
            </p>
            <h1 className="truncate text-sm font-semibold">/{pageUrl}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${
                isCurrentPagePublished
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'text-muted-foreground'
              }`}
            >
              {isCurrentPagePublished ? 'Página publicada' : 'Borrador'}
            </span>
            <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              {saveStateText}
            </span>
            <Button variant="outline" onClick={handlePreviewPage}>
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => void (isCurrentPagePublished ? handleUnpublishPage() : handlePublishPage())}
              disabled={!layout || isSaving || publishing}
            >
              {publishing
                ? isCurrentPagePublished
                  ? 'Despublicando...'
                  : 'Publicando...'
                : isCurrentPagePublished
                  ? 'Despublicar'
                  : 'Publicar'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
            <Button onClick={handleManualSave} disabled={!layout || !isDirty || isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r bg-background">
          <div className="flex border-b">
            <button
              className={`flex-1 px-3 py-2 text-sm ${leftTab === 'pages' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
              onClick={() => handleLeftTabChange('pages')}
            >
              Pages
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm ${leftTab === 'ui' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
              onClick={() => handleLeftTabChange('ui')}
            >
              UI
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm ${leftTab === 'data' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
              onClick={() => handleLeftTabChange('data')}
            >
              Data
            </button>
          </div>

          <div className="h-[calc(100%-41px)] overflow-auto">
            {leftTab === 'pages' && (
              <div className="p-4">
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    PÁGINAS ({pages.length})
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newPageName}
                      onChange={(event) => setNewPageName(event.target.value)}
                      placeholder="Nueva página"
                      className="h-9"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleCreatePage()
                        }
                      }}
                    />
                    <Button
                      onClick={() => void handleCreatePage()}
                      disabled={creatingPage || !newPageName.trim()}
                      className="h-9"
                    >
                      {creatingPage ? '...' : 'Crear'}
                    </Button>
                  </div>
                </div>

                {pagesLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando páginas...</p>
                ) : pagesError ? (
                  <p className="text-sm text-destructive">{pagesError}</p>
                ) : pages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay páginas en esta aplicación.</p>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => {
                      const isActive = page.url === selectedPageUrl
                      const isCurrentRoutePage = page.id === pageId
                      const isEditing = editingPageId === page.id
                      const isActionLoading = pageActionLoadingId === page.id

                      return (
                        <div
                          key={page.id}
                          className={`w-full rounded-md border px-2.5 py-1.5 ${
                            isActive ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingPageName}
                                onChange={(event) => setEditingPageName(event.target.value)}
                                placeholder="Nombre"
                                className="h-8"
                              />
                              <Input
                                value={editingPageUrl}
                                onChange={(event) => setEditingPageUrl(event.target.value)}
                                placeholder="slug"
                                className="h-8"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7"
                                  onClick={() => void handleUpdatePage(page)}
                                  disabled={isActionLoading}
                                >
                                  {isActionLoading ? 'Guardando...' : 'Guardar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  onClick={cancelEditPage}
                                  disabled={isActionLoading}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  className="min-w-0 flex-1 text-left"
                                  onClick={() => {
                                    setLeftTab('pages')
                                    setSelectedPageUrl(page.url)
                                  }}
                                  type="button"
                                >
                                  <div className="flex items-center gap-2">
                                    <p className="min-w-0 truncate text-sm font-medium">{page.nombre}</p>
                                    {isActive && (
                                      <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        Seleccionada
                                      </span>
                                    )}
                                    {!isActive && isCurrentRoutePage && (
                                      <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        Actual
                                      </span>
                                    )}
                                    {page.esInicio && isActive && (
                                      <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        Inicio
                                      </span>
                                    )}
                                  </div>
                                  <p className="truncate text-xs text-muted-foreground">/{page.url}</p>
                                </button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded border text-sm text-muted-foreground hover:bg-muted"
                                      disabled={isActionLoading}
                                      aria-label="Acciones de página"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditPage(page)}>
                                      Editar
                                    </DropdownMenuItem>
                                    {!page.esInicio && (
                                      <DropdownMenuItem onClick={() => void handleSetHome(page)}>
                                        Marcar como inicio
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => requestDeletePage(page)}
                                      disabled={pages.length <= 1}
                                    >
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <AlertDialog
              open={Boolean(pendingDeletePageId)}
              onOpenChange={(open) => {
                if (!open) {
                  cancelDeletePage()
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar página</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`¿Eliminar la página "${pages.find((item) => item.id === pendingDeletePageId)?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={Boolean(pendingDeletePageId && pageActionLoadingId === pendingDeletePageId)}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={Boolean(pendingDeletePageId && pageActionLoadingId === pendingDeletePageId)}
                    onClick={(event) => {
                      const pageToDelete = pages.find((item) => item.id === pendingDeletePageId)
                      if (!pageToDelete) {
                        event.preventDefault()
                        return
                      }
                      event.preventDefault()
                      void handleDeletePage(pageToDelete)
                    }}
                  >
                    {pendingDeletePageId && pageActionLoadingId === pendingDeletePageId
                      ? 'Eliminando...'
                      : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {leftTab === 'ui' && (
              <div className="p-4">
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    AGREGAR WIDGET
                  </p>
                  <div className="space-y-2">
                    {Object.entries(WIDGETS).map(([widgetType, widgetDefinition]) => (
                      <button
                        key={widgetType}
                        className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleAddWidget(widgetType as keyof typeof WIDGETS)}
                        disabled={isLoading}
                        type="button"
                      >
                        <span className="font-medium">{widgetDefinition.etiqueta}</span>
                        <span className="text-xs text-muted-foreground">{widgetDefinition.categoria}</span>
                      </button>
                    ))}
                  </div>
                  {isLoading && (
                    <p className="mt-2 text-xs text-muted-foreground">Cargando layout de la página...</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    WIDGETS EN PÁGINA ({orderedWidgets.length})
                  </p>

                  <Input
                    value={uiFilter}
                    onChange={(event) => setUiFilter(event.target.value)}
                    placeholder="Buscar widgets..."
                    className="mb-3 h-9"
                  />

                  {selectedWidget && (
                    <div className="mb-3 rounded-md border bg-card p-2">
                      <p className="mb-2 truncate text-xs text-muted-foreground">
                        Seleccionado: {selectedWidget.id}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1"
                          onClick={() => duplicateWidget(selectedWidget.id)}
                        >
                          Duplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 flex-1"
                          onClick={() => removeWidget(selectedWidget.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  )}

                  {orderedWidgets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Esta página no tiene widgets todavía.
                    </p>
                  ) : filteredWidgets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay resultados para "{uiFilter}".
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredWidgets.map((widget, index) => {
                        const widgetLabel = WIDGETS[widget.type as keyof typeof WIDGETS]?.etiqueta ?? widget.type
                        const isSelected = selectedWidgetId === widget.id

                        return (
                          <button
                            key={widget.id}
                            className={`w-full rounded-md border px-3 py-2 text-left ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'bg-card hover:bg-muted'
                            }`}
                            onClick={() => setSelectedWidget(widget.id)}
                            type="button"
                          >
                            <p className="truncate text-sm font-medium">{widgetLabel} {index + 1}</p>
                            <p className="truncate text-[11px] text-muted-foreground/80">ID: {widget.id}</p>
                            <p className="text-xs text-muted-foreground">
                              x:{widget.x} y:{widget.y} · {widget.w}x{widget.h}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {leftTab === 'data' && (
              <div className="p-4">
                <div className="mb-4">
                  <div className="grid grid-cols-2 rounded-md border p-1">
                    <button
                      className={`rounded px-2 py-1 text-sm ${
                        dataTab === 'queries' ? 'bg-muted font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => setDataTab('queries')}
                      type="button"
                    >
                      Queries
                    </button>
                    <button
                      className={`rounded px-2 py-1 text-sm ${
                        dataTab === 'js' ? 'bg-muted font-medium' : 'text-muted-foreground'
                      }`}
                      onClick={() => setDataTab('js')}
                      type="button"
                    >
                      JS
                    </button>
                  </div>
                </div>

                {dataTab === 'queries' && (
                  <>
                    <div className="mb-3 rounded-md border bg-card p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {queryFormMode === 'edit' ? 'EDITAR QUERY' : 'NUEVA QUERY'}
                      </p>

                      <div className="space-y-2">
                        <Input
                          value={queryName}
                          onChange={(event) => setQueryName(event.target.value)}
                          placeholder="Nombre de la query"
                          className="h-9"
                        />

                        <select
                          value={querySourceId}
                          onChange={(event) => setQuerySourceId(event.target.value)}
                          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="">Selecciona una fuente</option>
                          {dataSources.map((source) => (
                            <option key={source.id} value={source.id}>
                              {source.nombre} ({source.tipo})
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={queryMethod}
                            onChange={(event) => setQueryMethod(event.target.value)}
                            className="h-9 rounded-md border bg-background px-2 text-sm"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                          <Input
                            value={queryPath}
                            onChange={(event) => setQueryPath(event.target.value)}
                            placeholder="/ruta"
                            className="col-span-2 h-9"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={queryRunOnLoad}
                            onChange={(event) => setQueryRunOnLoad(event.target.checked)}
                          />
                          Ejecutar al cargar
                        </label>

                        {queryFormError && (
                          <p className="text-xs text-destructive">{queryFormError}</p>
                        )}

                        {dataSources.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No hay fuentes de datos en esta app. Crea una fuente para usar queries.
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 flex-1"
                            disabled={querySaving || dataSources.length === 0}
                            onClick={() => void handleSaveQuery()}
                          >
                            {querySaving ? 'Guardando...' : queryFormMode === 'edit' ? 'Actualizar' : 'Crear'}
                          </Button>

                          {queryFormMode === 'edit' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={resetQueryForm}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      QUERIES ({queries.length})
                    </p>

                    <Input
                      value={queryFilter}
                      onChange={(event) => setQueryFilter(event.target.value)}
                      placeholder="Buscar queries..."
                      className="mb-3 h-9"
                    />

                    {queriesLoading ? (
                      <p className="text-sm text-muted-foreground">Cargando queries...</p>
                    ) : queriesError ? (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive">{queriesError}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => void loadQueries()}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : queries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay queries en esta página.</p>
                    ) : filteredQueries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay resultados para "{queryFilter}".</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredQueries.map((queryItem) => {
                          const method = String(queryItem.config?.method ?? 'GET').toUpperCase()
                          const path = String(queryItem.config?.path ?? '')

                          return (
                            <div key={queryItem.id} className="rounded-md border bg-card px-3 py-2">
                              <p className="truncate text-sm font-medium">{queryItem.nombre}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                Fuente: {queryItem.fuente.nombre} ({queryItem.fuente.tipo})
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {method} {path || '/'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {queryItem.ejecutarAlCargar ? 'Ejecuta al cargar' : 'Ejecución manual'}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  className="h-7"
                                  onClick={() => void handleRunQuery(queryItem.id)}
                                  disabled={runningQueryId === queryItem.id}
                                >
                                  {runningQueryId === queryItem.id ? 'Running...' : 'Run'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  onClick={() => handleEditQuery(queryItem)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7"
                                  onClick={() => void handleDeleteQuery(queryItem.id)}
                                >
                                  Eliminar
                                </Button>
                              </div>

                              {queryRunResults[queryItem.id] && (
                                <div className="mt-2 rounded border bg-muted/40 p-2">
                                  <p className="text-xs text-muted-foreground">
                                    {queryRunResults[queryItem.id].ok ? 'OK' : 'ERROR'} ·
                                    {' status '}
                                    {queryRunResults[queryItem.id].status ?? 'n/a'} ·
                                    {' '}
                                    {queryRunResults[queryItem.id].durationMs}ms
                                  </p>

                                  {queryRunResults[queryItem.id].error ? (
                                    <p className="mt-1 text-xs text-destructive">
                                      {queryRunResults[queryItem.id].error}
                                    </p>
                                  ) : (
                                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                                      {JSON.stringify(queryRunResults[queryItem.id].data ?? null, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                {dataTab === 'js' && (
                  <>
                    <div className="mb-3 rounded-md border bg-card p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {jsFormMode === 'edit' ? 'EDITAR JS OBJECT' : 'NUEVO JS OBJECT'}
                      </p>

                      <div className="space-y-2">
                        <Input
                          value={jsName}
                          onChange={(event) => setJsName(event.target.value)}
                          placeholder="Nombre del objeto JS"
                          className="h-9"
                        />

                        <textarea
                          value={jsCode}
                          onChange={(event) => setJsCode(event.target.value)}
                          placeholder={'return {}'}
                          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />

                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={jsRunOnLoad}
                            onChange={(event) => setJsRunOnLoad(event.target.checked)}
                          />
                          Ejecutar al cargar
                        </label>

                        {jsFormError && (
                          <p className="text-xs text-destructive">{jsFormError}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 flex-1"
                            disabled={jsSaving}
                            onClick={() => void handleSaveJsObject()}
                          >
                            {jsSaving ? 'Guardando...' : jsFormMode === 'edit' ? 'Actualizar' : 'Crear'}
                          </Button>

                          {jsFormMode === 'edit' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={resetJsForm}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      JS OBJECTS ({jsObjects.length})
                    </p>

                    <Input
                      value={jsFilter}
                      onChange={(event) => setJsFilter(event.target.value)}
                      placeholder="Buscar JS Objects..."
                      className="mb-3 h-9"
                    />

                    {jsLoading ? (
                      <p className="text-sm text-muted-foreground">Cargando objetos JS...</p>
                    ) : jsError ? (
                      <div className="space-y-2">
                        <p className="text-sm text-destructive">{jsError}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => void loadJsObjects()}
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : jsObjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No hay objetos JS configurados para esta página.
                      </p>
                    ) : filteredJsObjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay resultados para "{jsFilter}".</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredJsObjects.map((jsObject) => (
                          <div key={jsObject.id} className="rounded-md border bg-card px-3 py-2">
                            <p className="truncate text-sm font-medium">{jsObject.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {jsObject.ejecutarAlCargar ? 'Ejecuta al cargar' : 'Ejecución manual'}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7"
                                onClick={() => handleEditJsObject(jsObject)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7"
                                onClick={() => void handleDeleteJsObject(jsObject.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        <main
          ref={canvasAreaRef}
          className="min-w-0 flex-1 bg-muted/20"
          tabIndex={-1}
        >
          {leftTab === 'ui' ? (
            <GridCanvas isEditing={true} maxWidth={1400} />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Selecciona la pestaña UI para visualizar y editar el canvas.
            </div>
          )}
        </main>

        <aside className="w-72 shrink-0 border-l bg-background">
          <WidgetProperties />
        </aside>
      </div>
    </div>
  )
}
