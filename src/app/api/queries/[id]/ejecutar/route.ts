import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

function normalizeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const raw = value as Record<string, unknown>
  const entries = Object.entries(raw)
    .filter(([, headerValue]) => typeof headerValue === 'string' || typeof headerValue === 'number' || typeof headerValue === 'boolean')
    .map(([headerName, headerValue]) => [headerName, String(headerValue)])

  return Object.fromEntries(entries)
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const query = await prisma.query.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        config: true,
        fuente: {
          select: {
            tipo: true,
            config: true,
          },
        },
      },
    })

    if (!query) {
      return NextResponse.json({ error: 'Query no encontrada' }, { status: 404 })
    }

    if (query.fuente.tipo !== 'REST_API') {
      return NextResponse.json(
        { error: 'Solo se soporta ejecución REST API en este MVP' },
        { status: 400 }
      )
    }

    const queryConfig =
      typeof query.config === 'object' && query.config !== null
        ? (query.config as Record<string, unknown>)
        : {}

    const sourceConfig =
      typeof query.fuente.config === 'object' && query.fuente.config !== null
        ? (query.fuente.config as Record<string, unknown>)
        : {}

    const method = String(queryConfig.method ?? 'GET').toUpperCase()
    const path = String(queryConfig.path ?? '').trim()

    const baseUrl = String(
      sourceConfig.baseUrl ?? sourceConfig.baseURL ?? sourceConfig.url ?? ''
    ).trim()

    const isAbsolutePath = /^https?:\/\//i.test(path)

    if (!isAbsolutePath && !baseUrl) {
      return NextResponse.json(
        { error: 'La fuente no tiene baseUrl/url configurada' },
        { status: 400 }
      )
    }

    const targetUrl = isAbsolutePath
      ? path
      : new URL(path || '/', baseUrl).toString()

    const sourceHeaders = normalizeHeaders(sourceConfig.headers)
    const queryHeaders = normalizeHeaders(queryConfig.headers)

    const headers: Record<string, string> = {
      ...sourceHeaders,
      ...queryHeaders,
    }

    const hasBody = !['GET', 'HEAD'].includes(method)
    const body = hasBody && queryConfig.body !== undefined
      ? JSON.stringify(queryConfig.body)
      : undefined

    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const startedAt = Date.now()
      const response = await fetch(targetUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      })
      const durationMs = Date.now() - startedAt

      const text = await response.text()
      let parsed: unknown = text

      if (text) {
        try {
          parsed = JSON.parse(text)
        } catch {
          parsed = text
        }
      }

      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        durationMs,
        data: parsed,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout al ejecutar query' },
        { status: 504 }
      )
    }

    console.error('POST /api/queries/[id]/ejecutar:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar query' },
      { status: 500 }
    )
  }
}
