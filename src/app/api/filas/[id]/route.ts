import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const fila = await prisma.fila.update({
      where: { id },
      data: { columnas: body.columnas },
      include: { widgets: true },
    })

    return NextResponse.json(fila)
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar fila" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.fila.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar fila" }, { status: 500 })
  }
}