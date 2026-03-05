# Política Interna — Documentación Final de Acuerdos (2026-03-04)

## Objetivo

Estandarizar cómo se registran los acuerdos técnicos/funcionales para que cada decisión relevante quede trazable, verificable y mantenible.

## Qué debe documentarse como acuerdo final

Un tema entra como acuerdo final cuando:

1. Fue validado por el equipo.
2. Está implementado en código (o infraestructura).
3. Tiene evidencia de rutas de archivo concretas.
4. Tiene impacto operativo claro.

## Qué no entra como acuerdo final

- Ideas en exploración sin implementación.
- Supuestos temporales sin validación de equipo.
- Notas personales sin evidencia técnica.

## Estructura obligatoria del documento

Todo archivo `ACUERDO_*` debe incluir:

- Estado (`Implementado`, `Pendiente`, `Deprecado`).
- Decisión acordada.
- Reglas del MVP o de alcance.
- Evidencia de implementación (rutas de código).
- Impacto operativo.

## Checklist de cierre (Definition of Done documental)

- [ ] Código implementado y funcional.
- [ ] Documento `ACUERDO_*` creado/actualizado.
- [ ] Evidencias de implementación agregadas.
- [ ] Índice en `documentacion/README.md` actualizado.
- [ ] Convención de nombres respetada (`ACUERDO_<TEMA>_<YYYY-MM-DD>.md`).

## Convenciones de mantenimiento

- Si un acuerdo cambia, se actualiza su archivo existente y se refleja el cambio de estado.
- Si un acuerdo queda obsoleto, se marca como `Deprecado` con fecha y reemplazo.
- Si hay ruptura de compatibilidad, debe quedar explícita en “Impacto operativo”.

## Responsabilidad

- Quien implementa el cambio también actualiza su documentación de acuerdo.
- No se considera “cerrado” un cambio técnico sin su acuerdo final registrado.
