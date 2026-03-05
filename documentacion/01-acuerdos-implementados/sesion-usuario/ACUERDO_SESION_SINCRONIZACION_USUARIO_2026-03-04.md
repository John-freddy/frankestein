# Acuerdo Final — Sesión y Sincronización de Usuario Global (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- La autenticación del MVP se apoya en NextAuth con sesión JWT.
- El token de sesión incluye `id`, `rol` y `nombre` del usuario autenticado.
- El objeto de sesión expone `id`, `rol` y `nombre` para consumo en frontend.
- En el layout del builder se sincroniza la sesión activa hacia el store global (`useAppStore`).
- Si no hay sesión, el usuario global se limpia (`usuario = null`).

## Reglas MVP acordadas

- El store global de usuario es la fuente de lectura para UI compartida del builder.
- La sincronización de sesión→store se realiza por efecto reactivo sobre cambios de sesión.
- La ruta de login oficial es `/login`.
- Solo usuarios activos pasan autorización de credenciales.

## Evidencia de implementación

- Configuración de NextAuth + callbacks JWT/session: `src/auth.ts`
- Store global de app/usuario: `src/store/useAppStore.ts`
- Sincronización de sesión al store en layout builder: `src/app/builder/layout.tsx`

## Impacto operativo

- Unifica datos de identidad/rol para componentes del builder.
- Evita duplicar lectura de sesión en cada componente visual.
- Permite decisiones de UI/permiso basadas en rol de forma consistente.
