import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const apps = await prisma.aplicacion.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(apps)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener aplicaciones" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const slug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const app = await prisma.aplicacion.create({
      data: {
        nombre,
        slug,
        descripcion: descripcion ?? "",
        publicada: false,
        tema: {},
        config: {},
        creadoPorUsuario: {
          connect: { id: usuario.id },
        },
      },
    })

    return NextResponse.json(app, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una app con ese nombre" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear aplicación" }, { status: 500 })
  }
}