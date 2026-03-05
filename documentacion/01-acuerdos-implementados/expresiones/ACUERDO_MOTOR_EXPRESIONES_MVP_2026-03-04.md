# Acuerdo Final — Motor de Expresiones `{{}}` MVP (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- El motor de expresiones soporta placeholders `{{...}}` sobre texto.
- La resolución de variables usa **dot notation** (acceso por propiedades anidadas).
- El contexto disponible en MVP es:
  - `global` (usuario de sesión)
  - `page` (variables de página)
  - `query` (resultados de queries)
- Si una ruta no existe o falla la evaluación, se retorna string vacío en lugar de romper render.
- Si el valor es objeto, se serializa con `JSON.stringify` para salida de texto.

## Reglas MVP acordadas

- No se ejecuta JavaScript arbitrario dentro de `{{}}`.
- No se exponen variables de entorno (`process.env`) al motor de expresiones.
- El motor está orientado a lectura de datos (no mutación de estado).

## Ejemplos válidos

- `{{global.usuario.nombre}}`
- `{{page.filtroActivo}}`
- `{{query.getCasos.data.length}}`

## Evidencia de implementación

- Evaluador de expresiones y resolución por path: `src/lib/expresiones.ts`
- Construcción de contexto (`global`, `page`, `query`): `src/lib/expresiones.ts`
- Soporte de campo tipo expresión en widgets de texto: `src/widgets/texto/schema.ts`
- Especificación técnica alineada: `docs/especificaciones_iniciales.md`

## Limitaciones actuales

- No hay operadores condicionales ni funciones (`map`, `filter`, etc.) en MVP.
- El resultado de objetos se muestra serializado como texto.
