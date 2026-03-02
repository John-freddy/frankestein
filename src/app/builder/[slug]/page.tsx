"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, FileText, Trash2 } from "lucide-react"

interface Pagina {
  id: string
  nombre: string
  url: string
  esInicio: boolean
  orden: number
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
  const [showForm, setShowForm] = useState(false)
  const [nombrePagina, setNombrePagina] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApp()
  }, [slug])

  async function fetchApp() {
    try {
      const res = await fetch("/api/aplicaciones")
      const apps = await res.json()
      const found = apps.find((a: Aplicacion) => a.slug === slug)
      if (found) {
        setApp(found)
        fetchPaginas(found.id)
      }
    } catch {
      setLoading(false)
    }
  }

  async function fetchPaginas(appId: string) {
    try {
      const res = await fetch(`/api/aplicaciones/${appId}/paginas`)
      const data = await res.json()
      setPaginas(data)
      if (data.length > 0 && !paginaActiva) {
        setPaginaActiva(data[0])
      }
    } finally {
      setLoading(false)
    }
  }

  async function crearPagina() {
    if (!nombrePagina.trim() || !app) return
    setCreating(true)
    try {
      const res = await fetch(`/api/aplicaciones/${app.id}/paginas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombrePagina }),
      })
      if (res.ok) {
        setNombrePagina("")
        setShowForm(false)
        fetchPaginas(app.id)
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-muted-foreground">Cargando...</div>
  }

  if (!app) {
    return <div className="p-8 text-muted-foreground">Aplicación no encontrada</div>
  }

  return (
    <div className="flex h-full">
      {/* Sidebar de páginas */}
      <aside className="w-56 border-r bg-background flex flex-col shrink-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {app.nombre}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {paginas.map((pagina) => (
            <button
              key={pagina.id}
              onClick={() => setPaginaActiva(pagina)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                paginaActiva?.id === pagina.id
                  ? "bg-secondary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{pagina.nombre}</span>
              {pagina.esInicio && (
                <span className="ml-auto text-xs text-muted-foreground">inicio</span>
              )}
            </button>
          ))}

          {showForm ? (
            <div className="mt-2 flex flex-col gap-1">
              <Input
                placeholder="Nombre de la página"
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
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowForm(false)}>
                  ✕
                </Button>
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

      {/* Canvas central */}
      <main className="flex-1 flex items-center justify-center text-muted-foreground">
        {paginaActiva ? (
          <div className="text-center">
            <p className="text-lg font-medium">{paginaActiva.nombre}</p>
            <p className="text-sm mt-1">El canvas va aquí</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-medium">Sin páginas</p>
            <p className="text-sm mt-1">Crea una página para empezar</p>
          </div>
        )}
      </main>
    </div>
  )
}