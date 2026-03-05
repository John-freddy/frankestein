# Acuerdo Final — API Grid por Página (GET/PUT) (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- Se define un endpoint dedicado por página para gestión del layout:
  - `GET /api/paginas/[id]/grid`
  - `PUT /api/paginas/[id]/grid`
- `GET` devuelve el layout normalizado para el editor/render público (`id`, `name`, `widgets`, `isDraft`).
- `PUT` persiste el arreglo `widgets` completo en `layoutData`.

## Reglas del contrato MVP

- `PUT` requiere `widgets` como array en body JSON.
- Cada widget debe tener al menos `id`, `type` y `x` para pasar validación básica.
- Si la página no existe en `GET`, responde `404` con mensaje de error.
- Errores de validación en `PUT` responden `400`.
- Errores no controlados en `GET`/`PUT` responden `500`.

## Formato esperado (resumen)

### GET 200

```json
{
  "id": "<paginaId>",
  "name": "<nombrePagina>",
  "widgets": [/* GridWidget[] */],
  "isDraft": true
}
```

### PUT request body

```json
{
  "widgets": [/* GridWidget[] */]
}
```

### PUT 200

```json
{
  "id": "<paginaId>",
  "name": "<nombrePagina>",
  "widgets": [/* layoutData actualizado */]
}
```

## Evidencia de implementación

- Endpoint `GET`/`PUT` y validaciones: `src/app/api/paginas/[id]/grid/route.ts`
- Persistencia en DB (`layoutData`): `prisma/schema.prisma`
- Consumo desde editor (carga/guardado): `src/app/editor/[pageId]/page.tsx`

## Impacto operativo

- Unifica el contrato de persistencia para editor y render público.
- Simplifica integración frontend al usar un único endpoint para lectura/escritura de layout.
- Reduce inconsistencias al centralizar validaciones básicas en servidor.
