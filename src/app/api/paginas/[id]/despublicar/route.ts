import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * POST /api/paginas/[id]/despublicar
 * Marca una página como borrador y ajusta el estado de publicación de la app.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const existingPage = await prisma.pagina.findUnique({
      where: { id },
      select: {
        id: true,
        aplicacionId: true,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const page = await prisma.pagina.update({
      where: { id },
      data: {
        isPublished: false,
        isDraft: true,
        publishedAt: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        url: true,
        isDraft: true,
        isPublished: true,
        publishedAt: true,
        aplicacionId: true,
      },
    })

    const publishedPagesCount = await prisma.pagina.count({
      where: {
        aplicacionId: page.aplicacionId,
        deletedAt: null,
        isPublished: true,
      },
    })

    const appPublished = publishedPagesCount > 0

    await prisma.aplicacion.update({
      where: { id: page.aplicacionId },
      data: {
        publicada: appPublished,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      page,
      appPublished,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al despublicar página' }, { status: 500 })
  }
}
