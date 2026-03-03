import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { GridWidget } from '@/types/layout'

/**
 * GET /api/paginas/[id]/grid
 * Recuperar el layout de una página
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const page = await prisma.pagina.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        layoutData: true,
        isDraft: true,
        aplicacion: {
          select: { id: true },
        },
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Página no encontrada' },
        { status: 404 }
      )
    }

    const layout = {
      id: page.id,
      name: page.nombre,
      widgets: (page.layoutData as unknown as GridWidget[]) || [],
      isDraft: page.isDraft,
    }

    return NextResponse.json(layout)
  } catch (err) {
    console.error('GET /api/paginas/[id]/grid:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/paginas/[id]/grid
 * Actualizar el layout de una página
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { widgets }: { widgets: GridWidget[] } = await req.json()

    if (!Array.isArray(widgets)) {
      return NextResponse.json(
        { error: 'widgets debe ser un array' },
        { status: 400 }
      )
    }

    // Validar que cada widget tenga los campos requeridos
    for (const widget of widgets) {
      if (!widget.id || !widget.type || widget.x === undefined) {
        return NextResponse.json(
          { error: 'Estructura de widget inválida' },
          { status: 400 }
        )
      }
    }

    const page = await prisma.pagina.update({
      where: { id },
      data: {
        layoutData: widgets as any,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        layoutData: true,
      },
    })

    return NextResponse.json({
      id: page.id,
      name: page.nombre,
      widgets: page.layoutData,
    })
  } catch (err) {
    console.error('PUT /api/paginas/[id]/grid:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
