import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { filaId, columna, tipo, configuracion } = await request.json()

    if (!filaId || columna === undefined || !tipo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const existente = await prisma.widget.findFirst({
      where: { filaId, columna },
    })
    if (existente) {
      return NextResponse.json({ error: "Esa celda ya tiene un widget" }, { status: 409 })
    }

    const widget = await prisma.widget.create({
      data: {
        filaId,
        columna,
        tipo,
        configuracion: configuracion ?? {},
        orden: columna,
      },
    })

    return NextResponse.json(widget, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear widget" }, { status: 500 })
  }
}