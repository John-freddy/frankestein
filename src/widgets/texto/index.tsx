// src/widgets/texto/index.tsx

import React from "react"
import { TextoConfig } from "./config"

interface Props {
  config: TextoConfig
}

const variantes = {
  h1: "text-4xl font-bold",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-medium",
  p:  "text-base",
}

const colores = {
  default: "text-foreground",
  muted:   "text-muted-foreground",
  primary: "text-primary",
  danger:  "text-destructive",
}

const alineaciones = {
  left:   "text-left",
  center: "text-center",
  right:  "text-right",
}

export function WidgetTexto({ config }: Props) {
  const Tag = config.variante as keyof React.JSX.IntrinsicElements

  const clases = [
    variantes[config.variante as keyof typeof variantes]   ?? variantes.p,
    colores[config.color as keyof typeof colores]        ?? colores.default,
    alineaciones[config.alineacion as keyof typeof alineaciones] ?? alineaciones.left,
  ].join(" ")

  return <Tag className={clases}>{config.contenido}</Tag>
}