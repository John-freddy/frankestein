import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const app = await prisma.aplicacion.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(app)
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar aplicación" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await prisma.aplicacion.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar aplicación" }, { status: 500 })
  }
}