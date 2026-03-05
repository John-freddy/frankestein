# Acuerdo Final — Manejo de Variables (2026-03-04)

## Estado

**Implementado**

## Decisión acordada

Se adopta un modelo de variables en 4 niveles:

1. **Globales** → Zustand
2. **De página** → Zustand (slice por `pageId`)
3. **De widget** → `useState`
4. **De entorno** → `process.env` **solo en servidor**

## Reglas MVP acordadas

- Las variables de entorno no se exponen al motor `{{}}`.
- Las variables requeridas de entorno se validan al arrancar (fail-fast).
- Convención de entorno oficial: `AUTH_SECRET` y `AUTH_URL` (sin fallback legacy).

## Variables de entorno requeridas

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `ENCRYPTION_KEY`

## Evidencia de implementación

- Validación runtime: `src/lib/env.server.ts`
- Activación de validación al iniciar: `src/app/layout.tsx`
- Plantilla de variables: `.env.example`
- Especificación técnica alineada: `docs/especificaciones_iniciales.md`

## Notas operativas

- Si falta alguna variable requerida, la app falla en startup con mensaje explícito.
- Si `AUTH_URL` no es URL válida o `DATABASE_URL` no es PostgreSQL, falla en startup.
