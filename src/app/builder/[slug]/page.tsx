"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, FileText, Trash2, Columns2, Columns3, Square, Type, Image, Minus, MousePointer, List, X } from "lucide-react"
import { WIDGETS, TipoWidget } from "@/widgets/registro"
import { WidgetTexto } from "@/widgets/texto"

interface Widget {
  id: string
  tipo: string
  columna: number
  configuracion: any
}

interface Fila {
  id: string
  columnas: number
  orden: number
  widgets: Widget[]
}

interface Pagina {
  id: string
  nombre: string
  url: string
  esInicio: boolean
}

interface Aplicacion {
  id: string
  nombre: string
  slug: string
  publicada: boolean
}

const WIDGETS_CATALOGO = [
  { tipo: "texto",     label: "Texto",     icon: Type,         categoria: "Basico" },
  { tipo: "imagen",    label: "Imagen",    icon: Image,        categoria: "Basico" },
  { tipo: "separador", label: "Separador", icon: Minus,        categoria: "Basico" },
  { tipo: "boton",     label: "Boton",     icon: MousePointer, categoria: "Basico" },
  { tipo: "selector",  label: "Selector",  icon: List,         categoria: "Basico" },
]

function RenderWidget({ widget }: { widget: Widget }) {
  if (widget.tipo === "texto") {
    return <WidgetTexto config={widget.configuracion} />
  }
  return <span className="text-xs text-muted-foreground italic">{widget.tipo}</span>
}

export default function AppEditorPage() {
  const params = useParams()
  const slug = params.slug as string
  const [app, setApp] = useState<Aplicacion | null>(null)
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [paginaActiva, setPaginaActiva] = useState<Pagina | null>(null)
  const [filas, setFilas] = useState<Fila[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombrePagina, setNombrePagina] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [widgetSeleccionado, setWidgetSeleccionado] = useState<{ filaId: string; columna: number } | null>(null)
  const [panelDerecho, setPanelDerecho] = useState<Widget | null>(null)

  useEffect(() => { fetchApp() }, [slug])
  useEffect(() => { if (paginaActiva) fetchFilas(paginaActiva.id) }, [paginaActiva])

  async function fetchApp() {
    const res = await fetch("/api/aplicaciones")
    const apps = await res.json()
    const found = apps.find((a: Aplicacion) => a.slug === slug)
    if (found) {
      setApp(found)
      const res2 = await fetch(`/api/aplicaciones/${found.id}/paginas`)
      const pags = await res2.json()
      setPaginas(pags)
      if (pags.length > 0) setPaginaActiva(pags[0])
    }
    setLoading(false)
  }

  async function fetchFilas(paginaId: string) {
    const res = await fetch(`/api/paginas/${paginaId}/filas`)
    const data = await res.json()
    setFilas(data)
  }

  async function crearPagina() {
    if (!nombrePagina.trim() || !app) return
    setCreating(true)
    const res = await fetch(`/api/aplicaciones/${app.id}/paginas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombrePagina }),
    })
    if (res.ok) {
      const nueva = await res.json()
      setNombrePagina("")
      setShowForm(false)
      const res2 = await fetch(`/api/aplicaciones/${app.id}/paginas`)
      const pags = await res2.json()
      setPaginas(pags)
      setPaginaActiva(nueva)
      toast.success("Pagina creada")
    } else {
      toast.error("Error al crear la pagina")
    }
    setCreating(false)
  }

  async function agregarFila() {
    if (!paginaActiva) return
    const res = await fetch(`/api/paginas/${paginaActiva.id}/filas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    if (res.ok) {
      fetchFilas(paginaActiva.id)
    } else {
      toast.error("Error al agregar fila")
    }
  }

  async function cambiarColumnas(filaId: string, columnas: number) {
    await fetch(`/api/filas/${filaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnas }),
    })
    if (paginaActiva) fetchFilas(paginaActiva.id)
  }

  async function eliminarFila(filaId: string) {
    const res = await fetch(`/api/filas/${filaId}`, { method: "DELETE" })
    if (res.ok) {
      if (paginaActiva) fetchFilas(paginaActiva.id)
      setWidgetSeleccionado(null)
      setPanelDerecho(null)
      toast.success("Fila eliminada", { duration: 1500 })
    } else {
      toast.error("Error al eliminar la fila")
    }
  }

  async function agregarWidget(tipo: string) {
    if (!widgetSeleccionado) {
      toast.error("Primero selecciona una celda del canvas")
      return
    }
    const fila = filas.find(f => f.id === widgetSeleccionado.filaId)
    const yaOcupada = fila?.widgets.find(w => w.columna === widgetSeleccionado.columna)
    if (yaOcupada) {
      toast.error("Esa celda ya tiene un widget")
      return
    }
    const porDefecto = WIDGETS[tipo as TipoWidget]?.porDefecto ?? {}
    const res = await fetch("/api/widgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filaId: widgetSeleccionado.filaId,
        columna: widgetSeleccionado.columna,
        tipo,
        configuracion: porDefecto,
      }),
    })
    if (res.ok) {
      const nuevoWidget = await res.json()
      if (paginaActiva) fetchFilas(paginaActiva.id)
      setPanelDerecho(nuevoWidget)
      toast.success("Widget agregado", { duration: 1500 })
    } else {
      toast.error("Error al agregar widget")
    }
  }

  function seleccionarCelda(filaId: string, columna: number) {
    setWidgetSeleccionado({ filaId, columna })
    const fila = filas.find(f => f.id === filaId)
    const widget = fila?.widgets.find(w => w.columna === columna)
    setPanelDerecho(widget ?? null)
  }

  // Guarda la configuracion del widget en la DB y refresca el canvas
  async function guardarConfigWidget(widgetId: string, configuracion: any) {
    await fetch(`/api/widgets/${widgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configuracion }),
    })
    if (paginaActiva) fetchFilas(paginaActiva.id)
  }

  async function togglePublicar() {
    if (!app) return
    const res = await fetch(`/api/aplicaciones/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicada: !app.publicada }),
    })
    if (res.ok) {
      const updated = await res.json()
      setApp(updated)
      toast.success(updated.publicada ? "App publicada" : "App despublicada", { duration: 2000 })
    } else {
      toast.error("Error al cambiar estado")
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Cargando...</div>
  if (!app) return <div className="p-8 text-muted-foreground">Aplicacion no encontrada</div>

  return (
    <div className="flex h-full">

      <aside className="w-52 border-r bg-background flex flex-col shrink-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {app.nombre}
          </p>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {paginas.map((pagina) => (
            <button
              key={pagina.id}
              onClick={() => { setPaginaActiva(pagina); setWidgetSeleccionado(null); setPanelDerecho(null) }}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                paginaActiva?.id === pagina.id ? "bg-secondary font-medium" : "hover:bg-muted"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{pagina.nombre}</span>
              {pagina.esInicio && <span className="ml-auto text-xs text-muted-foreground">inicio</span>}
            </button>
          ))}
          {showForm ? (
            <div className="mt-2 flex flex-col gap-1">
              <Input
                placeholder="Nombre"
                value={nombrePagina}
                onChange={(e) => setNombrePagina(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && crearPagina()}
                className="h-7 text-sm"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs flex-1" onClick={crearPagina} disabled={creating}>
                  {creating ? "..." : "Crear"}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowForm(false)}>x</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva pagina
            </button>
          )}
        </div>

        <div className="border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">Widgets</p>
          <div className="px-2 pb-2 flex flex-col gap-1">
            {WIDGETS_CATALOGO.map((w) => {
              const Icon = w.icon
              return (
                <button
                  key={w.tipo}
                  onClick={() => agregarWidget(w.tipo)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm w-full text-left transition-colors ${
                    widgetSeleccionado
                      ? "hover:bg-primary/10 hover:text-primary cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{w.label}</span>
                </button>
              )
            })}
          </div>
          {!widgetSeleccionado && (
            <p className="text-xs text-muted-foreground px-3 pb-3">
              Selecciona una celda para agregar
            </p>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        {!paginaActiva ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Selecciona o crea una pagina</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{paginaActiva.nombre}</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={app.publicada ? "outline" : "secondary"} onClick={togglePublicar}>
                  {app.publicada ? "Publicada" : "Publicar"}
                </Button>
                <Button size="sm" onClick={agregarFila}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar fila
                </Button>
              </div>
            </div>

            {filas.length === 0 ? (
              <div
                onClick={agregarFila}
                className="border-2 border-dashed rounded-lg p-16 text-center text-muted-foreground cursor-pointer hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Haz clic para agregar la primera fila</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filas.map((fila) => (
                  <div key={fila.id} className="border rounded-lg bg-background">
                    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/30">
                      <span className="text-xs text-muted-foreground mr-2">Columnas:</span>
                      {[1, 2, 3].map((n) => {
                        const icons = [Square, Columns2, Columns3]
                        const Icon = icons[n - 1]
                        return (
                          <button
                            key={n}
                            onClick={() => cambiarColumnas(fila.id, n)}
                            className={`p-1 rounded transition-colors ${fila.columnas === n ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        )
                      })}
                      <button
                        onClick={() => eliminarFila(fila.id)}
                        className="ml-auto p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div
                      className="grid gap-2 p-3 min-h-24"
                      style={{ gridTemplateColumns: `repeat(${fila.columnas}, 1fr)` }}
                    >
                      {Array.from({ length: fila.columnas }).map((_, colIndex) => {
                        const widget = fila.widgets.find(w => w.columna === colIndex)
                        const isSelected = widgetSeleccionado?.filaId === fila.id && widgetSeleccionado?.columna === colIndex
                        return (
                          <div
                            key={colIndex}
                            onClick={() => seleccionarCelda(fila.id, colIndex)}
                            className={`border-2 rounded flex items-center justify-center min-h-20 transition-colors cursor-pointer p-2 ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : widget
                                ? "border-transparent hover:border-primary/40"
                                : "border-dashed hover:border-primary/40"
                            }`}
                          >
                            {widget ? (
                              <div className="w-full">
                             <RenderWidget widget={widget} />
                             </div>
                              ) : (
                             <Plus className="h-4 w-4 opacity-40" />
                              )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button
                  onClick={agregarFila}
                  className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
                >
                  + Agregar fila
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <aside className="w-64 border-l bg-background flex flex-col shrink-0">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {panelDerecho ? "Configuracion" : "Propiedades"}
          </p>
          {panelDerecho && (
            <button onClick={() => setPanelDerecho(null)} className="hover:opacity-70">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1 p-3 overflow-auto">
          {widgetSeleccionado && !panelDerecho ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Selecciona un widget del catalogo para agregar aqui</p>
            </div>
          ) : panelDerecho ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium capitalize">
                {WIDGETS[panelDerecho.tipo as TipoWidget]?.etiqueta ?? panelDerecho.tipo}
              </p>
              {(WIDGETS[panelDerecho.tipo as TipoWidget]?.schema ?? []).map((campo) => (
                <div key={campo.campo} className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">{campo.etiqueta}</label>

                  {campo.tipo === "expresion" && (
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={panelDerecho.configuracion?.[campo.campo] ?? ""}
                      placeholder={"placeholder" in campo ? campo.placeholder : ""}
                      onChange={(e) => {
                        const nueva = { ...panelDerecho.configuracion, [campo.campo]: e.target.value }
                        setPanelDerecho({ ...panelDerecho, configuracion: nueva })
                        guardarConfigWidget(panelDerecho.id, nueva)
                      }}
                    />
                  )}

                  {campo.tipo === "selector" && (
                    <select
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={panelDerecho.configuracion?.[campo.campo] ?? ""}
                      onChange={(e) => {
                        const nueva = { ...panelDerecho.configuracion, [campo.campo]: e.target.value }
                        setPanelDerecho({ ...panelDerecho, configuracion: nueva })
                        guardarConfigWidget(panelDerecho.id, nueva)
                      }}
                    >
                      {"opciones" in campo && campo.opciones.map((op) => (
                        <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                      ))}
                    </select>
                  )}

                  {campo.tipo === "alineacion" && (
                    <div className="flex gap-1">
                      {["left", "center", "right"].map((a) => (
                        <button
                          key={a}
                          onClick={() => {
                            const nueva = { ...panelDerecho.configuracion, [campo.campo]: a }
                            setPanelDerecho({ ...panelDerecho, configuracion: nueva })
                            guardarConfigWidget(panelDerecho.id, nueva)
                          }}
                          className={`flex-1 py-1 text-xs border rounded ${
                            panelDerecho.configuracion?.[campo.campo] === a
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {a === "left" ? "Izq" : a === "center" ? "Centro" : "Der"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Selecciona una celda del canvas</p>
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}