import { WidgetRenderer } from '@/components/WidgetRenderer'

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
