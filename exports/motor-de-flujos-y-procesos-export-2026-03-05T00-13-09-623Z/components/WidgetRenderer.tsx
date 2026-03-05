type Widget = {
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
