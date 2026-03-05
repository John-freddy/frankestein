import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AppSlugPage({ params }: Props) {
  const { slug } = await params

  const app = await prisma.aplicacion.findFirst({
    where: { slug, publicada: true, deletedAt: null },
    include: {
      paginas: {
        where: { deletedAt: null, isPublished: true },
        orderBy: [{ esInicio: "desc" }, { orden: "asc" }],
        take: 1,
      },
    },
  })

  if (!app) return notFound()

  const paginaInicio = app.paginas[0]
  if (!paginaInicio) return notFound()

  redirect(`/app/${slug}/${paginaInicio.url}`)
}