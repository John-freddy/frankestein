/**
 * Definición de tipos para el nuevo sistema de grid layout
 */

/**
 * Tipos de widgets soportados
 */
export type TipoWidget = string

/**
 * Un widget individual dentro del grid
 */
export interface GridWidget {
  /** ID único del widget en el layout */
  id: string

  /** Tipo de widget (texto, input, tabla, etc.) */
  type: TipoWidget

  /** Configuración específica del widget */
  config: Record<string, any>

  /** Posición X en el grid (0-11 para grid de 12 columnas) */
  x: number

  /** Posición Y en el grid */
  y: number

  /** Ancho en unidades de grid (1-12) */
  w: number

  /** Alto en unidades de grid */
  h: number

  /** (Opcional) Z-index para solapamientos */
  zIndex?: number

  /** (Opcional) Si el widget está bloqueado */
  locked?: boolean

  /** (Opcional) Datos dinámicos cargados desde API */
  data?: Record<string, any>

  /** Timestamp de creación */
  createdAt: Date

  /** Timestamp de última actualización */
  updatedAt: Date
}

/**
 * Layout completo de una página
 */
export interface PageLayout {
  /** ID del layout */
  id: string

  /** Nombre de la página */
  name: string

  /** Array de widgets en el layout */
  widgets: GridWidget[]

  /** Numero de columnas del grid (normalmente 12) */
  cols?: number

  /** Si está en modo draft o publicado */
  isDraft?: boolean

  /** Metadata adicional */
  metadata?: {
    version: number
    title?: string
    description?: string
  }

  /** Timestamp */
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Cambios de layout cuando el usuario dragea/resizea
 */
export interface LayoutChange {
  widgetId: string
  x: number
  y: number
  w: number
  h: number
}

/**
 * Evento de cambio de layout
 */
export interface LayoutChangeEvent {
  layout: LayoutChange[]
  oldLayout?: LayoutChange[]
  layouts?: Record<string, LayoutChange[]>
  breakpoint?: string
}
