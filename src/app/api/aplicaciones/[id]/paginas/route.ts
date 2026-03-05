import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paginas = await prisma.pagina.findMany({
      where: { aplicacionId: id, deletedAt: null },
      orderBy: [{ esInicio: "desc" }, { orden: "asc" }],
    })
    return NextResponse.json(paginas)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener páginas" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const nombreLimpio = String(nombre).trim()
    if (!nombreLimpio) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    const baseUrl = toSlug(nombreLimpio)

    if (!baseUrl) {
      return NextResponse.json({ error: "El nombre no genera un slug válido" }, { status: 400 })
    }

    const existingUrls = await prisma.pagina.findMany({
      where: {
        aplicacionId: id,
        url: {
          startsWith: baseUrl,
        },
      },
      select: { url: true },
    })

    const existingUrlsSet = new Set(existingUrls.map((item) => item.url))
    let url = baseUrl
    let suffix = 2

    while (existingUrlsSet.has(url)) {
      url = `${baseUrl}-${suffix}`
      suffix += 1
    }

    const count = await prisma.pagina.count({
      where: { aplicacionId: id, deletedAt: null },
    })

    const pagina = await prisma.pagina.create({
      data: {
        nombre: nombreLimpio,
        url,
        esInicio: count === 0,
        orden: count,
        permisos: {},
        createdBy: usuario.id,
        aplicacion: { connect: { id } },
        creadoPorUsuario: { connect: { id: usuario.id } },
      },
    })

    return NextResponse.json(pagina, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una página con ese slug en esta app" },
        { status: 409 }
      )
    }

    console.error("Error creating página:", error)
    return NextResponse.json(
      { error: "Error al crear página", details: error.message },
      { status: 500 }
    )
  }
}