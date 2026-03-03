import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/paginas/[id]/resources
 * Recursos mínimos del editor para panel izquierdo (Queries + JS)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const page = await prisma.pagina.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const queries = await prisma.query.findMany({
      where: { paginaId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        fuenteId: true,
        config: true,
        ejecutarAlCargar: true,
        fuente: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
    })

    const jsObjects = await prisma.jsObject.findMany({
      where: { paginaId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        ejecutarAlCargar: true,
      },
    })

    return NextResponse.json({
      queries,
      jsObjects,
    })
  } catch (error) {
    console.error('GET /api/paginas/[id]/resources:', error)
    return NextResponse.json(
      { error: 'Error al obtener recursos de la página' },
      { status: 500 }
    )
  }
}
