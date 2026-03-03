'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GridCanvas } from '@/components/PageEditor/GridCanvas'
import { WidgetProperties } from '@/components/PageEditor/WidgetProperties'
import { usePageStore } from '@/store/usePageStore'
import { useEditorUiStore } from '@/store/useEditorUiStore'
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

  const { isSaving, saveStateText, scheduleAutoSave, saveNow } = useSaveController({
    pageId,
    setDirty,
    setError,
    debounceMs: 2000,
  })
  const [queriesLoading, setQueriesLoading] = useState(true)
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
  const [jsLoading, setJsLoading] = useState(true)
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

  const canvasAreaRef = useRef<HTMLElement | null>(null)
  const urlStateReadyRef = useRef(false)
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
    try {
      setRunningQueryId(queryId)

      const startedAt = Date.now()
      const res = await fetch(`/api/queries/${queryId}/ejecutar`, {
        method: 'POST',
      })

      const payload = await res.json().catch(() => ({}))
      const durationMs = Date.now() - startedAt

      if (!res.ok) {
        setQueryRunResults((prev) => ({
          ...prev,
          [queryId]: {
            ok: false,
            status: typeof payload?.status === 'number' ? payload.status : res.status,
            durationMs,
            executedAt: new Date().toISOString(),
            error: payload?.error || 'Error al ejecutar query',
          },
        }))
        return
      }

      setQueryRunResults((prev) => ({
        ...prev,
        [queryId]: {
          ok: true,
          status: typeof payload?.status === 'number' ? payload.status : 200,
          durationMs,
          executedAt: new Date().toISOString(),
          data: payload?.data,
        },
      }))
    } catch (error) {
      setQueryRunResults((prev) => ({
        ...prev,
        [queryId]: {
          ok: false,
          status: null,
          durationMs: 0,
          executedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Error al ejecutar query',
        },
      }))
    } finally {
      setRunningQueryId(null)
    }
  }

  useEffect(() => {
    resetLayout()
    clearSelection()
    setUiFilter('')
    resetQueryForm()
    resetJsForm()
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
        setLayout(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void fetchLayout()
  }, [pageId, setError, setLayout, setLoading])

  useEffect(() => {
    void loadQueries()
  }, [loadQueries])

  useEffect(() => {
    void loadSources()
  }, [loadSources])

  useEffect(() => {
    void loadJsObjects()
  }, [loadJsObjects])

  useEffect(() => {
    if (leftTab !== 'data' || dataTab !== 'queries') return
    if (!queriesError || queriesLoading) return

    void loadQueries()
  }, [leftTab, dataTab, queriesError, queriesLoading, loadQueries])

  useEffect(() => {
    if (leftTab !== 'data' || dataTab !== 'js') return
    if (!jsError || jsLoading) return

    void loadJsObjects()
  }, [leftTab, dataTab, jsError, jsLoading, loadJsObjects])

  useEffect(() => {
    if (leftTab !== 'data' || dataTab !== 'js') return
    if (!jsError?.toLowerCase().includes('reinicio')) return

    const timer = setTimeout(() => {
      void loadJsObjects()
    }, 3000)

    return () => clearTimeout(timer)
  }, [leftTab, dataTab, jsError, loadJsObjects, jsLoading])

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

  const orderedWidgets = [...(layout?.widgets ?? [])].sort(
    (firstWidget, secondWidget) =>
      firstWidget.y - secondWidget.y || firstWidget.x - secondWidget.x
  )

  const filteredWidgets = orderedWidgets.filter((widget) => {
    if (!uiFilter.trim()) return true

    const filterValue = uiFilter.toLowerCase()
    const widgetLabel = WIDGETS[widget.type as keyof typeof WIDGETS]?.etiqueta ?? widget.type

    return (
      widget.id.toLowerCase().includes(filterValue) ||
      widget.type.toLowerCase().includes(filterValue) ||
      widgetLabel.toLowerCase().includes(filterValue)
    )
  })

  const filteredQueries = queries.filter((queryItem) => {
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
  })

  const filteredJsObjects = jsObjects.filter((jsObject) => {
    if (!jsFilter.trim()) return true
    return jsObject.nombre.toLowerCase().includes(jsFilter.toLowerCase())
  })

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
    if (!layout) return

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
        throw new Error('No se pudo crear la página')
      }

      const page: PageSummary = await res.json()
      setNewPageName('')
      setLeftTab('ui')
      router.push(`/builder/${appSlug}/${page.url}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la página'
      setPagesError(message)
    } finally {
      setCreatingPage(false)
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
            <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              {saveStateText}
            </span>
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
              onClick={() => setLeftTab('pages')}
            >
              Pages
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm ${leftTab === 'ui' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
              onClick={() => setLeftTab('ui')}
            >
              UI
            </button>
            <button
              className={`flex-1 px-3 py-2 text-sm ${leftTab === 'data' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
              onClick={() => setLeftTab('data')}
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
                      const isActive = page.id === pageId

                      return (
                        <button
                          key={page.id}
                          className={`w-full rounded-md border px-3 py-2 text-left ${
                            isActive ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted'
                          }`}
                          onClick={() => {
                            if (isActive) {
                              setLeftTab('ui')
                              canvasAreaRef.current?.focus()
                              return
                            }
                            setLeftTab('ui')
                            router.push(`/builder/${appSlug}/${page.url}`)
                          }}
                          type="button"
                        >
                          <p className="truncate text-sm font-medium">{page.nombre}</p>
                          <p className="text-xs text-muted-foreground">/{page.url}{page.esInicio ? ' · inicio' : ''}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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
                        className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleAddWidget(widgetType as keyof typeof WIDGETS)}
                        type="button"
                      >
                        <span className="font-medium">{widgetDefinition.etiqueta}</span>
                        <span className="text-xs text-muted-foreground">{widgetDefinition.categoria}</span>
                      </button>
                    ))}
                  </div>
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
                      {filteredWidgets.map((widget) => {
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
                            <p className="truncate text-sm font-medium">{widget.id}</p>
                            <p className="truncate text-xs text-muted-foreground">{widgetLabel}</p>
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
          <GridCanvas isEditing={true} maxWidth={1400} />
        </main>

        <aside className="w-72 shrink-0 border-l bg-background">
          <WidgetProperties />
        </aside>
      </div>
    </div>
  )
}
