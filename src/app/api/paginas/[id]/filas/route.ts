import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const filas = await prisma.fila.findMany({
      where: { paginaId: id },
      orderBy: { orden: "asc" },
      include: { widgets: { orderBy: { orden: "asc" } } },
    })
    return NextResponse.json(filas)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener filas" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const count = await prisma.fila.count({ where: { paginaId: id } })

    const fila = await prisma.fila.create({
      data: {
        pagina: { connect: { id } },
        columnas: 1,
        orden: count,
      },
      include: { widgets: true },
    })

    return NextResponse.json(fila, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear fila" }, { status: 500 })
  }
}