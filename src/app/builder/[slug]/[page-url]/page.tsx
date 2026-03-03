import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BuilderEditorWorkspace from '@/components/PageEditor/BuilderEditorWorkspace'

interface Props {
  params: Promise<{ slug: string; 'page-url': string }>
}

export default async function BuilderPageEditor({ params }: Props) {
  const { slug, 'page-url': pageUrl } = await params

  const app = await prisma.aplicacion.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, nombre: true, slug: true },
  })

  if (!app) return notFound()

  const page = await prisma.pagina.findFirst({
    where: {
      aplicacionId: app.id,
      url: pageUrl,
      deletedAt: null,
    },
    select: {
      id: true,
      nombre: true,
      url: true,
    },
  })

  if (!page) return notFound()

  return (
    <BuilderEditorWorkspace
      appId={app.id}
      appSlug={app.slug}
      appNombre={app.nombre}
      pageId={page.id}
      pageNombre={page.nombre}
      pageUrl={page.url}
    />
  )
}
