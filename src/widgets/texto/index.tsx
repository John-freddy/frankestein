// src/widgets/texto/index.tsx

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
  const Tag = config.variante as keyof JSX.IntrinsicElements

  const clases = [
    variantes[config.variante]   ?? variantes.p,
    colores[config.color]        ?? colores.default,
    alineaciones[config.alineacion] ?? alineaciones.left,
  ].join(" ")

  return <Tag className={clases}>{config.contenido}</Tag>
}