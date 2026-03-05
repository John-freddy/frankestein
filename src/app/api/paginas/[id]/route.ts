import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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

    const existingPage = await prisma.pagina.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        url: true,
        esInicio: true,
        aplicacionId: true,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const nextNombre = typeof body?.nombre === 'string' ? body.nombre.trim() : existingPage.nombre
    const nextUrlRaw = typeof body?.url === 'string' ? body.url.trim() : existingPage.url
    const nextUrl = toSlug(nextUrlRaw)

    if (!nextNombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!nextUrl) {
      return NextResponse.json({ error: 'El slug es requerido' }, { status: 400 })
    }

    const markAsHome = body?.esInicio === true

    const result = await prisma.$transaction(async (tx) => {
      if (markAsHome) {
        await tx.pagina.updateMany({
          where: { aplicacionId: existingPage.aplicacionId, deletedAt: null },
          data: { esInicio: false },
        })
      }

      const updated = await tx.pagina.update({
        where: { id },
        data: {
          nombre: nextNombre,
          url: nextUrl,
          esInicio: markAsHome ? true : existingPage.esInicio,
          updatedAt: new Date(),
        },
      })

      return updated
    })

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una página con ese slug en esta app' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Error al actualizar página' }, { status: 500 })
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

    const existingPage = await prisma.pagina.findUnique({
      where: { id },
      select: {
        id: true,
        esInicio: true,
        isPublished: true,
        aplicacionId: true,
        url: true,
      },
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    }

    const activePagesCount = await prisma.pagina.count({
      where: {
        aplicacionId: existingPage.aplicacionId,
        deletedAt: null,
      },
    })

    if (activePagesCount <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar la última página de la aplicación' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.pagina.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          esInicio: false,
          isPublished: false,
          isDraft: true,
          publishedAt: null,
          updatedAt: new Date(),
        },
      })

      if (existingPage.esInicio) {
        const replacement = await tx.pagina.findFirst({
          where: {
            aplicacionId: existingPage.aplicacionId,
            deletedAt: null,
          },
          orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
        })

        if (replacement) {
          await tx.pagina.update({
            where: { id: replacement.id },
            data: { esInicio: true, updatedAt: new Date() },
          })
        }
      }

      const publishedPagesCount = await tx.pagina.count({
        where: {
          aplicacionId: existingPage.aplicacionId,
          deletedAt: null,
          isPublished: true,
        },
      })

      await tx.aplicacion.update({
        where: { id: existingPage.aplicacionId },
        data: {
          publicada: publishedPagesCount > 0,
          updatedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar página' }, { status: 500 })
  }
}
