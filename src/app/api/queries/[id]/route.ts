import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (typeof body?.ejecutarAlCargar === 'boolean') {
      data.ejecutarAlCargar = body.ejecutarAlCargar
    }

    if (typeof body?.method === 'string' || typeof body?.path === 'string') {
      const existing = await prisma.query.findUnique({
        where: { id },
        select: { config: true },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Query no encontrada' }, { status: 404 })
      }

      const currentConfig =
        typeof existing.config === 'object' && existing.config !== null
          ? (existing.config as Record<string, unknown>)
          : {}

      data.config = {
        ...currentConfig,
        ...(typeof body?.method === 'string' ? { method: body.method.toUpperCase() } : {}),
        ...(typeof body?.path === 'string' ? { path: body.path.trim() } : {}),
      }
    }

    const updated = await prisma.query.update({
      where: { id },
      data,
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

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una query con ese nombre en la página' },
        { status: 409 }
      )
    }

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Query no encontrada' }, { status: 404 })
    }

    console.error('PATCH /api/queries/[id]:', error)
    return NextResponse.json({ error: 'Error al actualizar query' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    await prisma.query.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Query no encontrada' }, { status: 404 })
    }

    console.error('DELETE /api/queries/[id]:', error)
    return NextResponse.json({ error: 'Error al eliminar query' }, { status: 500 })
  }
}
