import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(
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

    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}

    if (typeof body?.nombre === 'string') {
      const nombre = body.nombre.trim()
      if (!nombre) {
        return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
      }
      data.nombre = nombre
    }

    if (typeof body?.codigo === 'string') {
      data.codigo = body.codigo
    }

    if (typeof body?.ejecutarAlCargar === 'boolean') {
      data.ejecutarAlCargar = body.ejecutarAlCargar
    }

    const updated = await jsModel.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        codigo: true,
        ejecutarAlCargar: true,
      },
    })

    return NextResponse.json(updated)
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

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Objeto JS no encontrado' }, { status: 404 })
    }

    console.error('PATCH /api/js-objects/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar objeto JS' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await jsModel.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2021') {
      return NextResponse.json(
        { error: 'Falta aplicar el esquema de base de datos. Ejecuta: npx prisma db push' },
        { status: 500 }
      )
    }

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Objeto JS no encontrado' }, { status: 404 })
    }

    console.error('DELETE /api/js-objects/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar objeto JS' },
      { status: 500 }
    )
  }
}
