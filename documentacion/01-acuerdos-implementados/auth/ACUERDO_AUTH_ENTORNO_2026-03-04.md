# Acuerdo Final — Auth y Convenciones de Entorno (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

- Se utiliza NextAuth con proveedor de credenciales para el MVP.
- La sesión se maneja con estrategia JWT.
- La ruta de login oficial es `/login`.
- Se agrega `id`, `rol` y `nombre` al token/sesión para autorización en frontend y backend.
- La convención de variables de entorno para auth es `AUTH_SECRET` y `AUTH_URL`.

## Reglas MVP acordadas

- Solo variables `AUTH_*` para auth (sin fallback legacy).
- Variables de entorno se validan al arranque (fail-fast).
- `AUTH_URL` debe ser URL absoluta válida.
- `DATABASE_URL` debe ser conexión PostgreSQL.
- `ENCRYPTION_KEY` mínima de 32 caracteres.

## Variables de entorno relevantes

- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL`
- `ENCRYPTION_KEY`

## Evidencia de implementación

- Configuración NextAuth y callbacks: `src/auth.ts`
- Validación runtime de entorno: `src/lib/env.server.ts`
- Activación de validación al iniciar la app: `src/app/layout.tsx`
- Plantilla de variables de entorno: `.env.example`
- Especificación técnica alineada: `docs/especificaciones_iniciales.md`

## Impacto operativo

- Cualquier entorno sin `AUTH_SECRET`/`AUTH_URL` falla en startup con error explícito.
- Se estandariza nomenclatura de entorno para despliegues locales y productivos.
