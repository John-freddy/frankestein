import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * POST /api/paginas/[id]/publicar
 * Marca una página como publicada.
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

    const page = await prisma.pagina.update({
      where: { id },
      data: {
        isPublished: true,
        isDraft: false,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        url: true,
        isDraft: true,
        isPublished: true,
        publishedAt: true,
      },
    })

    return NextResponse.json(page)
  } catch (error) {
    return NextResponse.json({ error: 'Error al publicar página' }, { status: 500 })
  }
}
