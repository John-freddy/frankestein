# Low Code Builder — Especificaciones Técnicas v2.0

## Contexto y Objetivo

Este documento define las especificaciones técnicas de **Frankenstein (Frank)**, una herramienta open source y self-hosted para construir aplicaciones de gestión sin necesidad de programar cada pantalla desde cero.

**Modelo de distribución:** Cada persona u organización instala Frank en su propia infraestructura, usa sus propios recursos (base de datos, servidor), y construye sus propias aplicaciones. No es SaaS. No hay billing, planes, ni multi-tenancy.

El Builder es la primera de dos grandes componentes del sistema:

1. **Builder** — la herramienta para construir interfaces (este documento)
2. **Widgets** — los componentes que se agregan al Builder uno por uno (documento separado)

El objetivo del Builder es permitir crear aplicaciones completas configurando páginas visualmente, sin código. El primer caso de uso es el Motor de Procesos interno, pero la arquitectura soporta múltiples aplicaciones desde el inicio.

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + React |
| Componentes UI | Shadcn/ui + Tailwind CSS |
| Estado global | Zustand |
| Base de datos | PostgreSQL con JSONB |
| ORM | Prisma |
| Auth | NextAuth.js (credenciales + Google OAuth opcional) |
| Control de versiones | GitHub — obligatorio desde día uno |
| Distribución | Docker + docker-compose |
| Deploy desarrollo | Vercel (frontend) + Railway (DB) |
| Deploy producción | Cualquier servidor con Docker |

---

## Modelo de Datos

### Jerarquía
```
configuracion (instancia)
usuarios
aplicaciones → paginas → filas → widgets
aplicaciones → fuentes_datos → queries (por página)
```

### Tablas

```sql
-- Instancia
configuracion (
  id,
  nombre_organizacion,
  slug,
  logo_url,
  tema JSONB,           -- colores, tipografía, modo oscuro/claro
  config JSONB,         -- configuración general de la instancia
  created_at, updated_at
)

-- Usuarios
usuarios (
  id,
  email,
  nombre,
  password_hash,
  rol,                  -- 'admin' | 'editor' | 'viewer'
  activo,
  created_at, updated_at
)
-- admin: construye apps, gestiona usuarios, configura todo
-- editor: construye apps, no gestiona usuarios
-- viewer: solo usa las apps publicadas

-- Builder
aplicaciones (
  id,
  nombre,
  slug,                 -- URL-friendly, único
  descripcion,
  tema JSONB,           -- override del tema de la instancia (opcional)
  config JSONB,         -- configuración específica de la app
  publicada,            -- boolean: visible en /app/ solo si true
  created_by,
  created_at, updated_at, deleted_at
)

paginas (
  id,
  aplicacion_id,        -- FK → aplicaciones
  nombre,
  url,                  -- slug para la ruta
  permisos JSONB,       -- roles que pueden acceder
  es_inicio,            -- boolean: página principal de la app
  orden,
  created_by,
  created_at, updated_at, deleted_at
)

filas (
  id,
  pagina_id,            -- FK → paginas
  columnas,             -- 1, 2 o 3
  orden,
  created_at, updated_at
)

widgets (
  id,
  fila_id,              -- FK → filas
  columna,              -- posición dentro de la fila (0, 1, 2)
  tipo,                 -- 'texto' | 'tabla' | 'boton' | etc.
  configuracion JSONB,  -- propiedades específicas del widget
  orden,
  created_at, updated_at
)

-- Datos
fuentes_datos (
  id,
  aplicacion_id,        -- FK → aplicaciones
  nombre,
  tipo,                 -- 'rest_api' | 'n8n' | 'postgres'
  config JSONB,         -- credenciales encriptadas, URLs, headers
  created_at, updated_at
)

queries (
  id,
  pagina_id,            -- FK → paginas
  fuente_id,            -- FK → fuentes_datos
  nombre,               -- referenciable como {{query.nombre.data}}
  config JSONB,         -- method, path, params, body_template
  ejecutar_al_cargar,   -- boolean
  created_at, updated_at
)
```

### Notas sobre el Modelo
- **Sin `empresa_id`:** Cada instalación es single-tenant. El aislamiento es físico (instancias separadas).
- **Soft delete:** `deleted_at` en aplicaciones y páginas. Los usuarios borran cosas por accidente.
- **`created_by`:** Auditoría básica. Quién creó cada aplicación y página.
- **`publicada`:** Las apps en construcción no son visibles en modo `/app/`.
- **`es_inicio`:** Marca qué página es la landing de cada app, evita convenciones implícitas.
- **Credenciales encriptadas:** El campo `config` de `fuentes_datos` se encripta con AES-256 antes de guardar. La clave de encriptación viene de una variable de entorno.

---

## Las 6 Secciones del Builder

### 1. Canvas Central
Filas y columnas, sin drag & drop libre. Cada fila tiene 1, 2 o 3 columnas. Botones de acción por fila: agregar widget, cambiar columnas, eliminar, reordenar.

### 2. Panel Izquierdo
Biblioteca de widgets organizados por categoría. Crece automáticamente con cada widget registrado. Categorías: Básico, Datos, Proceso.

### 3. Panel Derecho
Configuración del widget seleccionado. Generado automáticamente desde el schema del widget.

**Tipos de campo en el panel:**
- Texto (input simple)
- Número
- Selector (dropdown con opciones)
- Color picker
- Toggle (booleano)
- Alineación (izquierda/centro/derecha)
- Acción (navegar, llamar query, modificar variable)
- Fuente de datos (selector de queries disponibles)
- Expresión `{{}}` (campo que acepta variables y referencias a queries)

### 4. Fuentes de Datos Globales
Conexiones definidas una vez a nivel de aplicación. Tipos soportados: REST API (MVP), n8n (Fase 3+), PostgreSQL directo (Fase 3+).

### 5. Queries por Página
Consultas que consumen las fuentes globales. Cada query tiene un nombre único dentro de la página. Los widgets las referencian como `{{query.getCasos.data}}`.

### 6. Funciones JavaScript por Página
Lógica reutilizable. Se pueden activar al cargar la página o manualmente desde un widget.

---

## Variables — 4 Niveles

| Nivel | Mecanismo | Ejemplos | Alcance |
|---|---|---|---|
| **Globales** | Zustand | `global.usuario`, `global.token` | Toda la sesión |
| **De página** | Zustand (slice por `pageId`) | `page.filaSeleccionada`, `page.filtroActivo` | Solo la página activa |
| **De widget** | useState | `widget.valorActual`, `widget.cargando` | Solo el widget |
| **De entorno** | `process.env` (server-only) | `DATABASE_URL`, `AUTH_URL`, `ENCRYPTION_KEY` | Toda la instancia |

**Convención MVP vigente:**
- Estado global y de página se maneja con Zustand para mantener un único patrón de estado.
- `process.env` no se expone directamente al motor de expresiones `{{}}` en MVP (evita fuga de secretos).
- Variables de entorno requeridas se validan al arrancar la app (fail-fast).

---

## Layout Global — App Shell

Topbar y sidebar definidos una vez, heredados por todas las páginas. Solo el contenido central cambia al navegar. Sidebar colapsable con modo íconos incluido de fábrica via Shadcn.

**En modo Builder (`/builder/`):** App Shell + paneles laterales + toolbar de edición.
**En modo App (`/app/`):** Solo App Shell + contenido. Sin paneles ni toolbars.

---

## Rutas

```
/login                          → autenticación
/setup                          → configuración inicial (solo si no hay usuarios)

/builder                        → lista de aplicaciones (dashboard del builder)
/builder/:app-slug              → editor visual de la app
/builder/:app-slug/:page-url    → página específica en modo editor

/app/:app-slug                  → aplicación en modo usuario final
/app/:app-slug/:page-url        → página en modo usuario final

/admin/usuarios                 → gestión de usuarios (solo admin)
/admin/configuracion            → configuración de la instancia (solo admin)

/api/...                        → API routes (CRUD, queries, auth)
```

---

## Motor de Expresiones `{{}}`

### MVP — Solo Dot Notation
```
{{global.usuario.nombre}}       → "Juan Pérez"
{{query.getCasos.data}}         → [array de resultados]
{{query.getCasos.data.length}}  → número
{{page.filtroActivo}}           → valor actual de la variable
```

### Comportamiento
- Se evalúan al renderizar y se re-evalúan cuando cambia la variable o query referenciada.
- Si la expresión falla, el widget muestra string vacío (no rompe la página).
- El contenido se sanitiza para prevenir XSS.
- No se permiten expresiones sobre variables de entorno en el MVP.
- **No se soportan funciones JS arbitrarias en el MVP.** Solo acceso a propiedades con dot notation.

### Post-MVP
- Transformaciones básicas: `.filter()`, `.map()`, `.find()`
- Operadores ternarios: `{{query.data.length > 0 ? 'Hay datos' : 'Vacío'}}`

---

## Sistema de Temas

Colores, tipografía y modo oscuro/claro definidos a nivel de instancia (`configuracion.tema`). Cada aplicación puede override con su propio tema. Todos los componentes Shadcn/ui los heredan automáticamente via CSS variables.

---

## Funcionalidades Adicionales

- **Navegación con parámetros** — `/casos/{{casoId}}` para pasar datos entre páginas.
- **Estados de carga y vacío** — cada widget maneja: cargando, con datos, vacío, error.
- **Manejo de errores centralizado** — toast global cuando una query falla.
- **Modo preview** — el builder puede mostrar la página como se vería en `/app/`.
- **Historial mínimo** — deshacer las últimas 20 acciones de la sesión (en memoria, no persistido).
- **Permisos por página** — roles que pueden acceder. Redirección si no autorizado.
- **Auto-save** — debounce de 2 segundos + indicador visual.

---

## Setup Inicial (Primera Instalación)

Cuando Frank se instala por primera vez (la DB está vacía):

1. El usuario accede a `/setup`
2. Crea el primer usuario admin (nombre, email, contraseña)
3. Configura nombre de la organización
4. Se crea la fila de `configuracion` y el usuario admin
5. Se redirige a `/builder`
6. Opcionalmente se instala una app template de ejemplo (Motor de Procesos básico)

**`/setup` solo funciona si no hay usuarios en la DB.** Si ya hay al menos un usuario, redirige a `/login`.

---

## Docker — Distribución

```yaml
# docker-compose.yml (simplificado)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://frank:frank@db:5432/frank
      - AUTH_SECRET=generate-a-secret
      - AUTH_URL=http://localhost:3000
      - ENCRYPTION_KEY=generate-another-secret
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=frank
      - POSTGRES_PASSWORD=frank
      - POSTGRES_DB=frank
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Variables de entorno requeridas:**
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `AUTH_SECRET` | Secreto para firmar sesiones |
| `AUTH_URL` | URL base de la instancia |
| `ENCRYPTION_KEY` | Clave AES-256 para encriptar credenciales de fuentes de datos |
| `GOOGLE_CLIENT_ID` | *(Opcional)* Para habilitar login con Google |
| `GOOGLE_CLIENT_SECRET` | *(Opcional)* Para habilitar login con Google |

---

## Arquitectura de Widgets — Regla de Oro

```
/widgets
  /texto
    index.tsx    ← el componente
    schema.ts    ← qué propiedades acepta
    config.ts    ← valores por defecto
  /tabla
    index.tsx
    schema.ts
    config.ts
```

> Un widget nunca importa nada de otro widget. Agregar un widget nuevo = crear su carpeta + una línea en el registro. Nunca modifica código existente.

---

## API del Builder

```
-- Aplicaciones
POST   /api/aplicaciones              → crear app
GET    /api/aplicaciones               → listar apps
GET    /api/aplicaciones/:id           → obtener app con páginas
PUT    /api/aplicaciones/:id           → actualizar config/tema
DELETE /api/aplicaciones/:id           → soft delete

-- Páginas
POST   /api/paginas                    → crear página
PUT    /api/paginas/:id                → actualizar
DELETE /api/paginas/:id                → soft delete
PUT    /api/paginas/reorder            → cambiar orden

-- Filas
POST   /api/filas                      → agregar fila a página
PUT    /api/filas/:id                  → cambiar columnas
DELETE /api/filas/:id                  → eliminar
PUT    /api/filas/reorder              → cambiar orden

-- Widgets
POST   /api/widgets                    → agregar widget a fila
PUT    /api/widgets/:id                → actualizar configuración
DELETE /api/widgets/:id                → eliminar
PUT    /api/widgets/reorder            → cambiar orden

-- Fuentes de datos
POST   /api/fuentes                    → crear fuente
PUT    /api/fuentes/:id                → actualizar
DELETE /api/fuentes/:id                → eliminar
POST   /api/fuentes/:id/test           → probar conexión

-- Queries
POST   /api/queries                    → crear query
PUT    /api/queries/:id                → actualizar
DELETE /api/queries/:id                → eliminar
POST   /api/queries/:id/ejecutar       → ejecutar query (server-side)

-- Usuarios (solo admin)
GET    /api/usuarios                   → listar
POST   /api/usuarios                   → crear
PUT    /api/usuarios/:id               → actualizar
DELETE /api/usuarios/:id               → desactivar
```

---

## Hitos de Desarrollo

### Fase 1A — Fundación (Semana 1-2)
GitHub, Next.js 14, Prisma + PostgreSQL (modelo completo), NextAuth.js con credenciales, seed de usuario admin y configuración, pantalla de `/setup`, Docker compose, deploy básico.

### Fase 1B — Builder Core (Semana 3-4)
App Shell (sidebar + topbar), CRUD de aplicaciones, CRUD de páginas, canvas con filas y columnas, motor de renderizado, panel izquierdo (catálogo vacío), panel derecho (motor schema-driven).

### Fase 1C — Plomería (Semana 5-6)
Variables globales (Zustand), motor de expresiones básico (dot notation), auto-save con debounce, modo app (ruta `/app/` limpia), manejo de errores (toasts), permisos por página.

### Fase 2 — Widgets Básicos (Semana 7-8)
Texto, Imagen, Separador, Botón, Selector estático. El widget Texto establece el patrón para todos los demás.

### Fase 3 — Datos (Semana 9-14)
Fuentes de datos REST API, queries por página, Tabla, Formulario, Tarjetas de resumen, Selector dinámico.

### Fase 4 — Proceso (Semana 15-20)
Timeline, Panel de aprobación, Kanban, Calendario, Gráfica (si hay tiempo).

---

## Fuera del Alcance del MVP

- Colaboración en tiempo real
- Control de versiones visual de apps
- Marketplace de widgets
- Conexiones directas a PostgreSQL (como fuente de datos)
- Funciones JS arbitrarias en expresiones
- Import/export de aplicaciones
- SSO / SAML

---

*Versión 2.0 — Febrero 2026*
*Frankenstein — Low Code Builder*
