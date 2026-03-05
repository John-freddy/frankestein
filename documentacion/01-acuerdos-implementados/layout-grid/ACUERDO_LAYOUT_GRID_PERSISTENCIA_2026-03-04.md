# Acuerdo Final — Layout Grid y Persistencia de `layoutData` (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- El editor visual usa un grid de 12 columnas basado en `react-grid-layout`.
- Drag & resize de widgets solo están habilitados en modo edición.
- El layout de cada página se representa como un arreglo de `GridWidget` con coordenadas (`x`, `y`) y tamaño (`w`, `h`).
- La persistencia del layout se guarda en base de datos dentro de `paginas.layoutData` (JSON).
- El backend expone API dedicada para leer y actualizar el grid por página.

## Reglas MVP acordadas

- El grid mantiene actualización de posiciones en store local antes de persistir.
- El backend valida estructura básica de cada widget en `PUT`.
- Si la página no existe se responde `404`; errores internos responden `500`.
- El layout en modo lectura (app pública) no permite edición.

## Evidencia de implementación

- Componente grid y eventos drag/resize: `src/components/PageEditor/GridCanvas.tsx`
- Tipos de layout/widgets: `src/types/layout.ts`
- Estado y mutaciones de layout: `src/store/usePageStore.ts`
- API de persistencia por página (`GET`/`PUT`): `src/app/api/paginas/[id]/grid/route.ts`
- Modelo Prisma con `layoutData` JSON en `Pagina`: `prisma/schema.prisma`

## Impacto operativo

- Estandariza una única representación de layout entre frontend, API y DB.
- Permite auto-save y guardado manual sobre la misma estructura.
- Facilita evolución futura (metadata, responsive, historial) sin cambiar el contrato base de `layoutData`.
