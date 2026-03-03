import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const fuentes = await prisma.fuenteDatos.findMany({
      where: { aplicacionId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        nombre: true,
        tipo: true,
      },
    })

    return NextResponse.json(fuentes)
  } catch (error) {
    console.error('GET /api/aplicaciones/[id]/fuentes:', error)
    return NextResponse.json(
      { error: 'Error al obtener fuentes de datos' },
      { status: 500 }
    )
  }
}
