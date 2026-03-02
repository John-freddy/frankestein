"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, FileText, Trash2, Columns2, Columns3, Square } from "lucide-react"

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
}

export default function AppEditorPage() {
  const { slug } = useParams<{ slug: string }>()
  const [app, setApp] = useState<Aplicacion | null>(null)
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [paginaActiva, setPaginaActiva] = useState<Pagina | null>(null)
  const [filas, setFilas] = useState<Fila[]>([])
  const [showForm, setShowForm] = useState(false)
  const [nombrePagina, setNombrePagina] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

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
    if (res.ok) fetchFilas(paginaActiva.id)
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
    await fetch(`/api/filas/${filaId}`, { method: "DELETE" })
    if (paginaActiva) fetchFilas(paginaActiva.id)
  }

  if (loading) return <div className="p-8 text-muted-foreground">Cargando...</div>
  if (!app) return <div className="p-8 text-muted-foreground">Aplicación no encontrada</div>

  return (
    <div className="flex h-full">
      {/* Sidebar páginas */}
      <aside className="w-56 border-r bg-background flex flex-col shrink-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {app.nombre}
          </p>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {paginas.map((pagina) => (
            <button
              key={pagina.id}
              onClick={() => setPaginaActiva(pagina)}
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
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowForm(false)}>✕</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva página
            </button>
          )}
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 overflow-auto p-6">
        {!paginaActiva ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Selecciona o crea una página</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{paginaActiva.nombre}</h2>
              <Button size="sm" onClick={agregarFila}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Agregar fila
              </Button>
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
                    {/* Toolbar de la fila */}
                    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-muted/30">
                      <span className="text-xs text-muted-foreground mr-2">Columnas:</span>
                      <button
                        onClick={() => cambiarColumnas(fila.id, 1)}
                        className={`p-1 rounded text-xs transition-colors ${fila.columnas === 1 ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        title="1 columna"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => cambiarColumnas(fila.id, 2)}
                        className={`p-1 rounded text-xs transition-colors ${fila.columnas === 2 ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        title="2 columnas"
                      >
                        <Columns2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => cambiarColumnas(fila.id, 3)}
                        className={`p-1 rounded text-xs transition-colors ${fila.columnas === 3 ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                        title="3 columnas"
                      >
                        <Columns3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => eliminarFila(fila.id)}
                        className="ml-auto p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Columnas */}
                    <div
                      className="grid gap-2 p-3 min-h-24"
                      style={{ gridTemplateColumns: `repeat(${fila.columnas}, 1fr)` }}
                    >
                      {Array.from({ length: fila.columnas }).map((_, colIndex) => (
                        <div
                          key={colIndex}
                          className="border-2 border-dashed rounded flex items-center justify-center min-h-20 text-muted-foreground hover:border-primary/40 transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4 opacity-40" />
                        </div>
                      ))}
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
    </div>
  )
}