import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

type QualityIssue = {
  level: 'warning' | 'error'
  message: string
}

function sanitizeFolderName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function buildAppDataFile(appData: unknown): string {
  return `export const appData = ${toJson(appData)}\n`
}

function buildWidgetRendererFile(): string {
  return `type Widget = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  config?: Record<string, unknown>
}

function getTextClass(variante: unknown): string {
  if (variante === 'h1') return 'text-3xl font-bold'
  if (variante === 'h2') return 'text-2xl font-semibold'
  if (variante === 'h3') return 'text-xl font-semibold'
  return 'text-base'
}

function getColorClass(color: unknown): string {
  if (color === 'muted') return 'text-zinc-500'
  if (color === 'primary') return 'text-blue-600'
  if (color === 'danger') return 'text-red-600'
  return 'text-zinc-900'
}

function getAlignClass(alineacion: unknown): string {
  if (alineacion === 'center') return 'text-center'
  if (alineacion === 'right') return 'text-right'
  return 'text-left'
}

export function WidgetRenderer({ widget }: { widget: Widget }) {
  if (widget.type === 'texto') {
    const contenido = String(widget.config?.contenido ?? 'Texto')
    const variante = widget.config?.variante
    const color = widget.config?.color
    const alineacion = widget.config?.alineacion

    return (
      <div className={[getTextClass(variante), getColorClass(color), getAlignClass(alineacion)].join(' ')}>
        {contenido}
      </div>
    )
  }

  return (
    <div className="widget-unsupported">
      Widget no soportado: {widget.type}
    </div>
  )
}
`
}

function buildPageRendererFile(): string {
  return `import { WidgetRenderer } from '@/components/WidgetRenderer'

type Widget = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  config?: Record<string, unknown>
}

export function PageRenderer({ widgets }: { widgets: ReadonlyArray<Widget> }) {
  const sorted = [...widgets].sort((a, b) => a.y - b.y || a.x - b.x)

  return (
    <div className="page-shell">
      <div className="widget-grid">
        {sorted.map((widget) => (
          <div
            key={widget.id}
            className="widget-card"
            style={{
              gridColumnStart: Math.max(1, Number(widget.x) + 1),
              gridRowStart: Math.max(1, Number(widget.y) + 1),
              gridColumnEnd: 'span ' + Math.max(1, Math.min(12, Number(widget.w) || 1)),
              gridRowEnd: 'span ' + Math.max(1, Number(widget.h) || 1),
            }}
          >
            <WidgetRenderer widget={widget} />
          </div>
        ))}
      </div>
    </div>
  )
}
`
}

function buildDynamicPageFile(): string {
  return `import { notFound } from 'next/navigation'
import { appData } from '@/lib/app-data'
import { PageRenderer } from '@/components/PageRenderer'

interface Props {
  params: Promise<{ pageSlug: string }>
}

export default async function ExportedPage({ params }: Props) {
  const { pageSlug } = await params
  const page = appData.pages.find((item) => item.url === pageSlug)

  if (!page) return notFound()

  return (
    <main className="app-main">
      <PageRenderer widgets={page.widgets} />
    </main>
  )
}
`
}

function buildHomePageFile(homePageUrl: string): string {
  return `import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/${homePageUrl}')
}
`
}

function buildLayoutFile(appName: string): string {
  return `import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${appName.replace(/'/g, "\\'")}',
  description: 'Aplicación exportada desde Frank',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
`
}

function buildReadme(appName: string, quality: { score: number; issues: QualityIssue[] }): string {
  return `# ${appName} (exportado desde Frank)

## Ejecutar local

\`npm install\`
\`npm run dev\`

## Validación de calidad

\`npm run quality\`

Incluye:
- Type check (tsc)
- Lint (next lint)
- Build de producción

## Resumen de calidad inicial

- Score: ${quality.score}/100
- Issues: ${quality.issues.length}
`
}

function evaluateQuality(appData: {
  pages: Array<{
    nombre: string
    url: string
    widgets: Array<{ type: string }>
    queries: Array<{ nombre: string; config: unknown }>
    jsObjects: Array<{ nombre: string; codigo: string }>
  }>
}) {
  const issues: QualityIssue[] = []
  const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

  for (const page of appData.pages) {
    if (page.widgets.length === 0) {
      issues.push({
        level: 'warning',
        message: `Página "${page.nombre}" no tiene widgets`,
      })
    }

    for (const widget of page.widgets) {
      if (widget.type !== 'texto') {
        issues.push({
          level: 'warning',
          message: `Widget no soportado en export actual: ${widget.type}`,
        })
      }
    }

    for (const query of page.queries) {
      const config = (query.config ?? {}) as Record<string, unknown>
      const method = String(config.method ?? 'GET').toUpperCase()
      const routePath = String(config.path ?? '')

      if (!validMethods.has(method)) {
        issues.push({
          level: 'error',
          message: `Query "${query.nombre}" tiene método inválido: ${method}`,
        })
      }

      if (!routePath.trim()) {
        issues.push({
          level: 'warning',
          message: `Query "${query.nombre}" no tiene path configurado`,
        })
      }
    }

    for (const jsObject of page.jsObjects) {
      try {
        // eslint-disable-next-line no-new-func
        new Function(jsObject.codigo || '')
      } catch {
        issues.push({
          level: 'error',
          message: `JS Object "${jsObject.nombre}" tiene sintaxis inválida`,
        })
      }
    }
  }

  const errors = issues.filter((issue) => issue.level === 'error').length
  const warnings = issues.filter((issue) => issue.level === 'warning').length
  const score = Math.max(0, 100 - errors * 20 - warnings * 5)

  return {
    score,
    errors,
    warnings,
    issues,
  }
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

    const app = await prisma.aplicacion.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        slug: true,
        paginas: {
          where: { deletedAt: null },
          orderBy: [{ esInicio: 'desc' }, { orden: 'asc' }],
          select: {
            id: true,
            nombre: true,
            url: true,
            esInicio: true,
            layoutData: true,
            queries: {
              select: {
                nombre: true,
                config: true,
                ejecutarAlCargar: true,
              },
            },
            jsObjects: {
              select: {
                nombre: true,
                codigo: true,
                ejecutarAlCargar: true,
              },
            },
          },
        },
      },
    })

    if (!app) {
      return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 })
    }

    if (!app.paginas.length) {
      return NextResponse.json(
        { error: 'La aplicación no tiene páginas para exportar' },
        { status: 400 }
      )
    }

    const appData = {
      id: app.id,
      nombre: app.nombre,
      slug: app.slug,
      pages: app.paginas.map((page) => ({
        id: page.id,
        nombre: page.nombre,
        url: page.url,
        esInicio: page.esInicio,
        widgets: Array.isArray(page.layoutData) ? page.layoutData : [],
        queries: page.queries,
        jsObjects: page.jsObjects,
      })),
    }

    const quality = evaluateQuality(appData)
    const homePage = appData.pages.find((page) => page.esInicio) ?? appData.pages[0]

    const exportSlug = sanitizeFolderName(app.slug || app.nombre) || 'app-export'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const folderName = `${exportSlug}-export-${timestamp}`
    const rootPath = process.cwd()
    const exportRoot = path.join(rootPath, 'exports', folderName)

    const files: Array<{ relativePath: string; content: string }> = [
      {
        relativePath: 'package.json',
        content: toJson({
          name: exportSlug,
          private: true,
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint',
            typecheck: 'tsc --noEmit',
            quality: 'npm run typecheck ; npm run lint ; npm run build',
          },
          dependencies: {
            next: '16.1.6',
            react: '19.2.3',
            'react-dom': '19.2.3',
          },
          devDependencies: {
            typescript: '^5.9.3',
            '@types/node': '^20.19.0',
            '@types/react': '^19.2.2',
            '@types/react-dom': '^19.2.2',
            eslint: '^9.35.0',
            'eslint-config-next': '16.1.6',
          },
        }),
      },
      {
        relativePath: 'tsconfig.json',
        content: toJson({
          compilerOptions: {
            target: 'ES2022',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: false,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            baseUrl: '.',
            paths: {
              '@/*': ['./*'],
            },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
          exclude: ['node_modules'],
        }),
      },
      {
        relativePath: 'next.config.ts',
        content: 'import type { NextConfig } from "next"\n\nconst nextConfig: NextConfig = {}\n\nexport default nextConfig\n',
      },
      {
        relativePath: 'next-env.d.ts',
        content: '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
      },
      {
        relativePath: 'app/globals.css',
        content: `html, body {
  margin: 0;
  padding: 0;
  font-family: Inter, Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

.app-main {
  min-height: 100vh;
  background: #f3f4f6;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  grid-auto-rows: 80px;
}

.widget-card {
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.widget-unsupported {
  border: 1px dashed #d4d4d8;
  border-radius: 8px;
  background: #fafafa;
  color: #71717a;
  font-size: 12px;
  padding: 8px;
}

.text-3xl {
  font-size: 30px;
  line-height: 1.2;
}

.text-2xl {
  font-size: 24px;
  line-height: 1.25;
}

.text-xl {
  font-size: 20px;
  line-height: 1.3;
}

.text-base {
  font-size: 16px;
  line-height: 1.4;
}

.font-bold {
  font-weight: 700;
}

.font-semibold {
  font-weight: 600;
}

.text-zinc-900 {
  color: #18181b;
}

.text-zinc-500 {
  color: #71717a;
}

.text-blue-600 {
  color: #2563eb;
}

.text-red-600 {
  color: #dc2626;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}
`,
      },
      {
        relativePath: 'app/layout.tsx',
        content: buildLayoutFile(app.nombre),
      },
      {
        relativePath: 'app/page.tsx',
        content: buildHomePageFile(homePage.url),
      },
      {
        relativePath: 'app/[pageSlug]/page.tsx',
        content: buildDynamicPageFile(),
      },
      {
        relativePath: 'components/PageRenderer.tsx',
        content: buildPageRendererFile(),
      },
      {
        relativePath: 'components/WidgetRenderer.tsx',
        content: buildWidgetRendererFile(),
      },
      {
        relativePath: 'lib/app-data.ts',
        content: buildAppDataFile(appData),
      },
      {
        relativePath: 'quality-report.json',
        content: toJson(quality),
      },
      {
        relativePath: 'README.md',
        content: buildReadme(app.nombre, quality),
      },
    ]

    for (const file of files) {
      const absoluteFilePath = path.join(exportRoot, file.relativePath)
      await mkdir(path.dirname(absoluteFilePath), { recursive: true })
      await writeFile(absoluteFilePath, file.content, 'utf-8')
    }

    const relativeExportPath = path.relative(rootPath, exportRoot)

    return NextResponse.json({
      ok: true,
      appId: app.id,
      appSlug: app.slug,
      exportPath: relativeExportPath,
      filesCount: files.length,
      quality,
    })
  } catch (error) {
    console.error('POST /api/aplicaciones/[id]/export:', error)
    return NextResponse.json({ error: 'Error al exportar aplicación' }, { status: 500 })
  }
}
