import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RenderWidget } from "@/components/render-widget"

interface Props {
  params: Promise<{ slug: string; "page-url": string }>
}

export default async function AppPage({ params }: Props) {
  const { slug, "page-url": pageUrl } = await params

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

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                <div key={colIndex} className="min-h-4">
                  {widget && <RenderWidget widget={widget as any} />}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}