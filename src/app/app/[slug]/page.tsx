import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

interface Props {
  params: Promise<{ slug: string; "page-url": string }>
}

export default async function AppPage({ params }: Props) {
  const { slug, "page-url": pageUrl } = await params

  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=/app/${slug}/${pageUrl}`)
  }

  const app = await prisma.aplicacion.findFirst({
    where: { slug, publicada: true, deletedAt: null },
  })

  if (!app) return notFound()

  const pagina = await prisma.pagina.findFirst({
    where: { aplicacionId: app.id, url: pageUrl, deletedAt: null },
    include: {
      filas: {
        orderBy: { orden: "asc" },
        include: {
          widgets: { orderBy: { orden: "asc" } },
        },
      },
    },
  })

  if (!pagina) return notFound()

  // Verificar permisos de la página
  const permisos = pagina.permisos as { roles?: string[] }
  if (permisos?.roles && permisos.roles.length > 0) {
    const rolUsuario = (session.user as any).rol ?? "viewer"
    if (!permisos.roles.includes(rolUsuario)) {
      return (
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Acceso restringido</p>
            <p className="text-sm">No tienes permiso para ver esta página.</p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">{pagina.nombre}</h1>
      <div className="flex flex-col gap-4">
        {pagina.filas.map((fila) => (
          <div
            key={fila.id}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${fila.columnas}, 1fr)` }}
          >
            {Array.from({ length: fila.columnas }).map((_, colIndex) => {
              const widget = fila.widgets.find((w) => w.columna === colIndex)
              return (
                <div key={colIndex} className="min-h-12">
                  {widget ? (
                    <div className="p-3 border rounded bg-muted/30 text-sm text-muted-foreground">
                      [{widget.tipo}] — renderizado disponible en Fase 2
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}