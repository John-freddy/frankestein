"use client"

import { WidgetTexto } from "@/widgets/texto"

interface Widget {
  id: string
  tipo: string
  columna: number
  configuracion: any
}

export function RenderWidget({ widget }: { widget: Widget }) {
  if (widget.tipo === "texto") return <WidgetTexto config={widget.configuracion} />
  return null
}