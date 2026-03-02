import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET — listar páginas de una aplicación
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paginas = await prisma.pagina.findMany({
      where: { aplicacionId: id, deletedAt: null },
      orderBy: { orden: "asc" },
    })
    return NextResponse.json(paginas)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener páginas" }, { status: 500 })
  }
}

// POST — crear nueva página
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const { nombre } = body

    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const url = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Contar páginas existentes para el orden
    const count = await prisma.pagina.count({
      where: { aplicacionId: id, deletedAt: null },
    })

    const pagina = await prisma.pagina.create({
  data: {
    nombre,
    url,
    orden: count,
    esInicio: count === 0,
    permisos: {},
    aplicacion: {
      connect: { id },
    },
    creadoPorUsuario: {
      connect: { id: usuario.id },
    },
  },
})

    return NextResponse.json(pagina, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear página" }, { status: 500 })
  }
}