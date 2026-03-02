"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, LayoutDashboard } from "lucide-react"

interface Aplicacion {
  id: string
  nombre: string
  slug: string
  descripcion: string
  publicada: boolean
  createdAt: string
}

export default function BuilderPage() {
  const [apps, setApps] = useState<Aplicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchApps()
  }, [])

  async function fetchApps() {
    try {
      const res = await fetch("/api/aplicaciones")
      const data = await res.json()
      setApps(data)
    } catch {
      setError("Error al cargar aplicaciones")
    } finally {
      setLoading(false)
    }
  }

  async function crearApp() {
    if (!nombre.trim()) return
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/aplicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al crear la aplicación")
        return
      }
      setNombre("")
      setDescripcion("")
      setShowForm(false)
      fetchApps()
    } catch {
      setError("Error al crear la aplicación")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Mis Aplicaciones</h1>
          <p className="text-muted-foreground mt-1">
            {apps.length === 0 ? "Aún no tienes aplicaciones" : `${apps.length} aplicación${apps.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Aplicación
        </Button>
      </div>

      {/* Formulario nueva app */}
      {showForm && (
        <Card className="mb-6 border-primary/50">
          <CardHeader>
            <CardTitle className="text-base">Nueva Aplicación</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              placeholder="Nombre de la aplicación"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crearApp()}
              autoFocus
            />
            <Input
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={crearApp} disabled={creating || !nombre.trim()}>
                {creating ? "Creando..." : "Crear"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setError("") }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de apps */}
      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : apps.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <LayoutDashboard className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Crea tu primera aplicación</p>
          <p className="text-sm mt-1">Haz clic en "Nueva Aplicación" para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="hover:border-primary/50 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{app.nombre}</CardTitle>
                <CardDescription>{app.descripcion || "Sin descripción"}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className={`text-xs px-2 py-1 rounded-full ${app.publicada ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {app.publicada ? "Publicada" : "Borrador"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}