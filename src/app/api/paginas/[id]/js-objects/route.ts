import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const jsModel = (prisma as any).jsObject
    if (!jsModel) {
      return NextResponse.json(
        { error: 'El servidor necesita reinicio para cargar el nuevo modelo JS Object. Reinicia `npm run dev`.' },
        { status: 500 }
      )
    }

    const { id } = await params

    const page = await prisma.pagina.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const jsObjects = await jsModel.findMany({
      where: { paginaId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        ejecutarAlCargar: true,
      },
    })

    return NextResponse.json(jsObjects)
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return NextResponse.json(
        { error: 'Falta aplicar el esquema de base de datos. Ejecuta: npx prisma db push' },
        { status: 500 }
      )
    }

    console.error('GET /api/paginas/[id]/js-objects:', error)
    return NextResponse.json(
      { error: 'Error al obtener objetos JS' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const jsModel = (prisma as any).jsObject
    if (!jsModel) {
      return NextResponse.json(
        { error: 'El servidor necesita reinicio para cargar el nuevo modelo JS Object. Reinicia `npm run dev`.' },
        { status: 500 }
      )
    }

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: pageId } = await params
    const body = await request.json()

    const nombre = String(body?.nombre ?? '').trim()
    const codigo = String(body?.codigo ?? '')
    const ejecutarAlCargar = Boolean(body?.ejecutarAlCargar)

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const page = await prisma.pagina.findUnique({
      where: { id: pageId },
      select: { id: true },
    })

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const created = await jsModel.create({
      data: {
        paginaId: pageId,
        nombre,
        codigo,
        ejecutarAlCargar,
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        ejecutarAlCargar: true,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return NextResponse.json(
        { error: 'Falta aplicar el esquema de base de datos. Ejecuta: npx prisma db push' },
        { status: 500 }
      )
    }

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un objeto JS con ese nombre en la página' },
        { status: 409 }
      )
    }

    console.error('POST /api/paginas/[id]/js-objects:', error)
    return NextResponse.json(
      { error: 'Error al crear objeto JS' },
      { status: 500 }
    )
  }
}
