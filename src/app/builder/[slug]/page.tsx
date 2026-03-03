"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [app, setApp] = useState<Aplicacion | null>(null)
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [loading, setLoading] = useState(true)
  const [nombrePagina, setNombrePagina] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    void fetchAppAndPages()
  }, [slug, router])

  async function fetchAppAndPages() {
    try {
      setLoading(true)
      const res = await fetch("/api/aplicaciones")
      const apps = await res.json()
      const found = apps.find((a: Aplicacion) => a.slug === slug)

      if (!found) {
        setApp(null)
        setPaginas([])
        return
      }

      setApp(found)
      const pagesRes = await fetch(`/api/aplicaciones/${found.id}/paginas`)
      const pages = await pagesRes.json()
      const pagesArray = Array.isArray(pages) ? pages : []
      setPaginas(pagesArray)

      if (pagesArray.length > 0) {
        router.replace(`/builder/${slug}/${pagesArray[0].url}`)
      }
    } catch (err) {
      console.error("Error loading app/pages:", err)
      toast.error("Error al cargar la aplicación")
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

      if (!res.ok) {
        toast.error("Error al crear la página")
        return
      }

      const createdPage = await res.json()
      setNombrePagina("")
      toast.success("Página creada")
      router.push(`/builder/${slug}/${createdPage.url}`)
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

  if (paginas.length > 0) {
    return <div className="p-8 text-muted-foreground">Redirigiendo al editor...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{app.nombre}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea la primera página para comenzar a editar en el Builder.
        </p>
      </div>

      <div className="border rounded-lg bg-background p-4 flex flex-col gap-3">
        <Input
          placeholder="Nombre de la página"
          value={nombrePagina}
          onChange={(e) => setNombrePagina(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void crearPagina()}
          autoFocus
        />
        <Button onClick={() => void crearPagina()} disabled={creating || !nombrePagina.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          {creating ? "Creando..." : "Crear y abrir editor"}
        </Button>
      </div>

      <div className="mt-4 border-2 border-dashed rounded-lg p-6 text-sm text-muted-foreground">
        Cuando esta app tenga páginas, esta ruta redirigirá automáticamente al editor.
      </div>
    </div>
  )
}