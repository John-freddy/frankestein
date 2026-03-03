import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/public/apps/[appSlug]/pages/[pageSlug]/layout
 * Obtener layout publicado de una página (sin autenticación)
 */
export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ appSlug: string; pageSlug: string }> }
) {
  try {
    const { appSlug, pageSlug } = await params
    const page = await prisma.pagina.findFirst({
      where: {
        url: pageSlug,
        isPublished: true,
        aplicacion: {
          slug: appSlug,
        },
      },
      select: {
        id: true,
        nombre: true,
        layoutData: true,
        publishedAt: true,
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: page.id,
      name: page.nombre,
      widgets: page.layoutData || [],
      publishedAt: page.publishedAt,
    })
  } catch (err) {
    console.error('[ERROR] GET public page layout:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
