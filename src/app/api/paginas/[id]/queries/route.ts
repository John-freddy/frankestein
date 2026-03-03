import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
        ejecutarAlCargar: true,
        config: true,
        fuente: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
    })

    return NextResponse.json(queries)
  } catch (error) {
    console.error('GET /api/paginas/[id]/queries:', error)
    return NextResponse.json(
      { error: 'Error al obtener queries' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: pageId } = await params
    const body = await request.json()

    const nombre = String(body?.nombre ?? '').trim()
    const fuenteId = String(body?.fuenteId ?? '').trim()
    const ejecutarAlCargar = Boolean(body?.ejecutarAlCargar)
    const method = String(body?.method ?? 'GET').toUpperCase()
    const path = String(body?.path ?? '').trim()

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!fuenteId) {
      return NextResponse.json({ error: 'La fuente es requerida' }, { status: 400 })
    }

    const page = await prisma.pagina.findUnique({
      where: { id: pageId },
      select: { id: true, aplicacionId: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const source = await prisma.fuenteDatos.findFirst({
      where: { id: fuenteId, aplicacionId: page.aplicacionId },
      select: { id: true },
    })

    if (!source) {
      return NextResponse.json(
        { error: 'La fuente no pertenece a esta aplicación' },
        { status: 400 }
      )
    }

    const query = await prisma.query.create({
      data: {
        paginaId: pageId,
        fuenteId,
        nombre,
        ejecutarAlCargar,
        config: {
          method,
          path,
        },
      },
      select: {
        id: true,
        nombre: true,
        fuenteId: true,
        ejecutarAlCargar: true,
        config: true,
        fuente: {
          select: {
            nombre: true,
            tipo: true,
          },
        },
      },
    })

    return NextResponse.json(query, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una query con ese nombre en la página' },
        { status: 409 }
      )
    }

    console.error('POST /api/paginas/[id]/queries:', error)
    return NextResponse.json({ error: 'Error al crear query' }, { status: 500 })
  }
}
