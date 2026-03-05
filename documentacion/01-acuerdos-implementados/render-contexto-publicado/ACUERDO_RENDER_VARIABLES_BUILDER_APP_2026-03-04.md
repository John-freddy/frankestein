# Acuerdo Final — Render de Variables Consistente en Builder y App Publicada (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- El motor `{{}}` del widget texto debe resolver variables de la misma forma en `/builder` y en `/app`.
- El contexto `global.usuario` no puede depender de un layout específico del builder.
- La sincronización de sesión hacia store global se centraliza en el layout raíz de la aplicación.

## Reglas MVP acordadas

- `SessionProvider` y sincronización de sesión->store se ejecutan en `src/app/layout.tsx`.
- `BuilderLayout` no duplica lógica de sincronización de usuario.
- `{{global.usuario.nombre}}` debe funcionar en preview/editor y en página publicada con sesión activa.

## Evidencia de implementación

- Sincronizador global: `src/components/auth/SessionStoreSync.tsx`
- Integración en layout raíz: `src/app/layout.tsx`
- Limpieza de sincronización duplicada en builder: `src/app/builder/layout.tsx`
- Evaluación de expresiones en widget texto: `src/components/PageEditor/WidgetRenderer.tsx`

## Impacto operativo

- Comportamiento consistente del render de variables entre modos builder y app final.
- Menor riesgo de desalineación por duplicar lógica de sesión en múltiples layouts.
