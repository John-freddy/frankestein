import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AppIndexPage({ params }: Props) {
  const { slug } = await params

  const app = await prisma.aplicacion.findFirst({
    where: { slug, deletedAt: null },
    include: {
      paginas: {
        where: { deletedAt: null },
        orderBy: [{ esInicio: "desc" }, { orden: "asc" }],
        take: 1,
      },
    },
  })

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Aplicación no encontrada
      </div>
    )
  }

  if (app.paginas.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Esta aplicación no tiene páginas
      </div>
    )
  }

  redirect(`/app/${slug}/${app.paginas[0].url}`)
}