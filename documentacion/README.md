# Documentación de Acuerdos Implementados

Esta carpeta concentra los acuerdos funcionales/técnicos que ya se definieron y **quedaron implementados en código**.

## Estructura

- `01-acuerdos-implementados/`
  - Un subdirectorio por tema (ej.: `variables/`, `auth/`, `builder/`, `queries/`)
  - Dentro de cada tema, uno o más archivos de acuerdo con fecha.
- `99-plantillas/`
  - Plantillas para crear nuevos acuerdos con el mismo formato.

## Políticas

- Política de documentación de acuerdos: `02-politicas/POLITICA_DOCUMENTACION_ACUERDOS_2026-03-04.md`

## Automatización

- Para regenerar índice y tabla consolidada automáticamente: `npm run docs:index`

## Convención de nombres

- Archivo de acuerdo: `ACUERDO_<TEMA>_<YYYY-MM-DD>.md`
- Ejemplo: `ACUERDO_MANEJO_VARIABLES_2026-03-04.md`

## Criterio de “acuerdo final”

Un acuerdo entra aquí solo cuando cumple ambos:

1. Está validado por el equipo.
2. Está aplicado en la base de código (con rutas de evidencia).

## Flujo recomendado

1. Se define el acuerdo en conversación/reunión.
2. Se implementa en código.
3. Se crea/actualiza el documento de acuerdo en esta carpeta.
4. Se agregan referencias a archivos impactados.
5. Se deja fecha y estado final.

<!-- ACUERDOS_AUTO_START -->
## Acuerdos implementados (índice rápido)

- API Grid por Página (GET/PUT): `01-acuerdos-implementados/api-grid/ACUERDO_API_GRID_PAGINA_2026-03-04.md`
- Auth y Convenciones de Entorno: `01-acuerdos-implementados/auth/ACUERDO_AUTH_ENTORNO_2026-03-04.md`
- Auto-save y Control de Guardado: `01-acuerdos-implementados/autosave/ACUERDO_AUTOSAVE_CONTROL_GUARDADO_2026-03-04.md`
- Criterios de Pruebas Mínimas por Acuerdo: `01-acuerdos-implementados/pruebas-minimas/ACUERDO_CRITERIOS_PRUEBAS_MINIMAS_2026-03-04.md`
- Layout Grid y Persistencia de `layoutData`: `01-acuerdos-implementados/layout-grid/ACUERDO_LAYOUT_GRID_PERSISTENCIA_2026-03-04.md`
- Manejo de Variables: `01-acuerdos-implementados/variables/ACUERDO_MANEJO_VARIABLES_2026-03-04.md`
- Motor de Expresiones `{{}}` MVP: `01-acuerdos-implementados/expresiones/ACUERDO_MOTOR_EXPRESIONES_MVP_2026-03-04.md`
- Render de Variables Consistente en Builder y App Publicada: `01-acuerdos-implementados/render-contexto-publicado/ACUERDO_RENDER_VARIABLES_BUILDER_APP_2026-03-04.md`
- Sesión y Sincronización de Usuario Global: `01-acuerdos-implementados/sesion-usuario/ACUERDO_SESION_SINCRONIZACION_USUARIO_2026-03-04.md`

## Estado actual (consolidado)

| Tema | Estado | Fecha | Documento |
|---|---|---|---|
| API Grid por Página (GET/PUT) | Implementado | 2026-03-04 | `01-acuerdos-implementados/api-grid/ACUERDO_API_GRID_PAGINA_2026-03-04.md` |
| Auth y Convenciones de Entorno | Implementado | 2026-03-04 | `01-acuerdos-implementados/auth/ACUERDO_AUTH_ENTORNO_2026-03-04.md` |
| Auto-save y Control de Guardado | Implementado | 2026-03-04 | `01-acuerdos-implementados/autosave/ACUERDO_AUTOSAVE_CONTROL_GUARDADO_2026-03-04.md` |
| Criterios de Pruebas Mínimas por Acuerdo | Implementado | 2026-03-04 | `01-acuerdos-implementados/pruebas-minimas/ACUERDO_CRITERIOS_PRUEBAS_MINIMAS_2026-03-04.md` |
| Layout Grid y Persistencia de `layoutData` | Implementado | 2026-03-04 | `01-acuerdos-implementados/layout-grid/ACUERDO_LAYOUT_GRID_PERSISTENCIA_2026-03-04.md` |
| Manejo de Variables | Implementado | 2026-03-04 | `01-acuerdos-implementados/variables/ACUERDO_MANEJO_VARIABLES_2026-03-04.md` |
| Motor de Expresiones `{{}}` MVP | Implementado | 2026-03-04 | `01-acuerdos-implementados/expresiones/ACUERDO_MOTOR_EXPRESIONES_MVP_2026-03-04.md` |
| Render de Variables Consistente en Builder y App Publicada | Implementado | 2026-03-04 | `01-acuerdos-implementados/render-contexto-publicado/ACUERDO_RENDER_VARIABLES_BUILDER_APP_2026-03-04.md` |
| Sesión y Sincronización de Usuario Global | Implementado | 2026-03-04 | `01-acuerdos-implementados/sesion-usuario/ACUERDO_SESION_SINCRONIZACION_USUARIO_2026-03-04.md` |
<!-- ACUERDOS_AUTO_END -->
