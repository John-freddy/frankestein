import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import PublicPageWithGridLayout from "@/components/PageEditor/PublicPageWithGridLayout"

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
    where: { 
      aplicacionId: app.id,
      url: pageUrl,
      deletedAt: null,
      isPublished: true // Verificar que esté publicada
    },
  })

  if (!pagina) return notFound()

  return (
    <PublicPageWithGridLayout
      appSlug={slug}
      pageSlug={pageUrl}
    />
  )
}