# Acuerdo Final — Auto-save y Control de Guardado (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- El editor de página usa auto-save con debounce para persistir cambios de layout/propiedades.
- El tiempo de debounce del MVP se fija en **2000 ms**.
- Debe existir guardado manual explícito (`Guardar`) además del auto-save.
- El sistema muestra estado de guardado visible para el usuario: `Sin cambios`, `Cambios pendientes`, `Guardando...`, `Guardado`, `Error al guardar`.
- Si hay cambios sin guardar, se previene salida accidental del navegador (`beforeunload`).

## Reglas técnicas acordadas

- Si hay un guardado en curso y llegan nuevos cambios, se encolan y se guardan en secuencia (sin perder el último estado).
- Al guardar correctamente, se limpia `isDirty` y se remueve error.
- El estado `Guardado` vuelve a `idle` tras un breve feedback visual.
- En error de persistencia, se conserva estado de error y mensaje para mostrar en UI.

## Evidencia de implementación

- Controlador de guardado (debounce, cola, estado): `src/hooks/useSaveController.ts`
- Integración en editor (auto-save + botón guardar + salida protegida): `src/app/editor/[pageId]/page.tsx`
- API de persistencia del layout (`GET`/`PUT`): `src/app/api/paginas/[id]/grid/route.ts`
- Especificación funcional que menciona auto-save (debounce): `docs/especificaciones_iniciales.md`

## Impacto operativo

- Reduce pérdida de cambios por navegación/cierre accidental.
- Mantiene una UX clara con feedback continuo del estado de persistencia.
- Centraliza la lógica de guardado en un hook reutilizable para futuras pantallas de edición.
