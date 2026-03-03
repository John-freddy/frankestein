import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { configuracion } = await request.json()

    const widget = await prisma.widget.update({
      where: { id },
      data: { configuracion },
    })

    return NextResponse.json(widget)
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar widget" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.widget.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar widget" }, { status: 500 })
  }
}