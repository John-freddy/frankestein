/**
 * Motor de expresiones para Frank.
 * Resuelve {{variable.propiedad}} usando dot notation.
 */

function resolverPath(path: string, contexto: Record<string, unknown>): unknown {
  const partes = path.trim().split(".")
  let valor: unknown = contexto

  for (const parte of partes) {
    if (valor === null || valor === undefined) return ""
    if (typeof valor !== "object") return ""
    valor = (valor as Record<string, unknown>)[parte]
  }

  return valor ?? ""
}

export function evaluarExpresion(
  texto: string,
  contexto: Record<string, unknown>
): string {
  if (!texto || typeof texto !== "string") return texto

  try {
    return texto.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const valor = resolverPath(path, contexto)
      if (valor === null || valor === undefined) return ""
      if (typeof valor === "object") return JSON.stringify(valor)
      return String(valor)
    })
  } catch {
    return texto
  }
}

export function buildContexto(params: {
  usuario?: { id: string; nombre: string; email: string; rol: string } | null
  pageVars?: Record<string, unknown>
  queryResults?: Record<string, unknown>
}): Record<string, unknown> {
  return {
    global: {
      usuario: params.usuario ?? {},
    },
    page: params.pageVars ?? {},
    query: params.queryResults ?? {},
  }
}