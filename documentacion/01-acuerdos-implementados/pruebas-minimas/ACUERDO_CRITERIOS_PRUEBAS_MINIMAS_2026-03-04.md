# Acuerdo Final — Criterios de Pruebas Mínimas por Acuerdo (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- Cada acuerdo implementado debe cerrarse con una validación mínima verificable.
- La validación debe ser proporcional al alcance del cambio (sin sobreprobar).
- Los resultados de validación deben quedar explícitos en el mismo flujo de trabajo del acuerdo.

## Checklist mínimo obligatorio

- [ ] Verificación de errores de archivos tocados (tipos/lint) sin errores relevantes.
- [ ] Prueba funcional principal del cambio (al menos 1 flujo feliz).
- [ ] Confirmación de no regresión inmediata en la pantalla/flujo impactado.
- [ ] Si hay script/comando asociado, ejecución al menos una vez con resultado esperado.

## Reglas de aplicación

- Cambios en UI: validar visualmente en el flujo afectado.
- Cambios en API: validar al menos un request exitoso y un caso de error esperado.
- Cambios en entorno/configuración: validar arranque o carga de configuración.
- No se amplía alcance para corregir fallas no relacionadas; se registran por separado.

## Evidencia de implementación

- Política base de acuerdos: `documentacion/02-politicas/POLITICA_DOCUMENTACION_ACUERDOS_2026-03-04.md`
- Índice automático de acuerdos y estado: `documentacion/README.md`

## Impacto operativo

- Cierres de trabajo más consistentes y auditables.
- Menos acuerdos “cerrados” sin comprobación funcional.
- Mejor trazabilidad entre decisión, implementación y validación.
