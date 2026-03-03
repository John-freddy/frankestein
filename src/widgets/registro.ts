// src/widgets/registro.ts

import { textoPorDefecto } from "./texto/config"
import { textoSchema }     from "./texto/schema"

export const WIDGETS = {
  texto: {
    etiqueta:    "Texto",
    categoria:   "Basico",
    schema:      textoSchema,
    porDefecto:  textoPorDefecto,
    componente:  () => import("./texto"),
  },
} as const

export type TipoWidget = keyof typeof WIDGETS