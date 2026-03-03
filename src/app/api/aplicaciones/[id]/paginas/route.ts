import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paginas = await prisma.pagina.findMany({
      where: { aplicacionId: params.id, deletedAt: null },
      orderBy: [{ esInicio: "desc" }, { orden: "asc" }],
    })
    return NextResponse.json(paginas)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener páginas" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    const count = await prisma.pagina.count({
      where: { aplicacionId: params.id, deletedAt: null },
    })

    const pagina = await prisma.pagina.create({
      data: {
        nombre,
        url,
        esInicio: count === 0,
        orden: count,
        permisos: {},
        aplicacion: { connect: { id: params.id } },
        creadoPorUsuario: { connect: { id: usuario.id } },
      },
    })

    return NextResponse.json(pagina, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear página" }, { status: 500 })
  }
}