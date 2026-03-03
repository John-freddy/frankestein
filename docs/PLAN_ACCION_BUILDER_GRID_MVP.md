# Plan de Acción — Builder Grid Libre (MVP)

## 1) Objetivo del documento

Definir un plan ejecutable por fases para organizar y consolidar el Builder con **grid libre**, manteniendo enfoque MVP, sin sobreconstruir.

Este plan está pensado para que puedas trabajar por bloques pequeños, con entregables claros y criterios de cierre por etapa.

---

## 2) Decisión base (congelada)

- Se mantiene **grid libre** como modelo oficial del canvas.
- Se elimina el enfoque de filas/columnas del alcance actual.
- La prioridad es **organización de la experiencia de edición** y **arquitectura interna limpia** antes de nuevas funcionalidades.

---

## 3) Principios de implementación

1. **Un solo flujo de guardado** (evitar doble persistencia).
2. **Separación Builder vs App final** (dos experiencias distintas, mismo motor de render).
3. **UI consistente con Shadcn/Tailwind** (sin estilos aislados difíciles de mantener).
4. **Arquitectura modular por componente/feature**.
5. **Cada iteración debe dejar el sistema usable**.

---

## 4) Arquitectura objetivo (alto nivel)

### 4.1 Shell de Builder (estructura de trabajo)

**Qué es:** el marco permanente del editor.

**Incluye:**
- Topbar del builder
- Panel izquierdo (explorador)
- Canvas central (grid libre)
- Panel derecho (inspector)

**Objetivo MVP:** que toda edición ocurra dentro de una sola experiencia coherente (sin saltar entre pantallas desconectadas).

---

### 4.2 Topbar de edición

**Qué es:** barra superior contextual del proyecto/página.

**Responsabilidades:**
- Breadcrumb: Aplicación > Página
- Estado de guardado: Sin cambios / Guardando / Guardado / Error
- Acciones principales: Preview, Publicar, Volver

**No incluir aún:** historial avanzado visual, colaboración en tiempo real.

---

### 4.3 Panel izquierdo (Explorador)

**Qué es:** navegación funcional del trabajo (como referencia de Appsmith, adaptada a Frank).

**Secciones MVP:**
- UI (árbol de widgets en página)
- Queries (lista por página)
- JS (funciones por página)

**Objetivo:** que el usuario no “pierda” contexto de dónde está y qué está editando.

---

### 4.4 Canvas central (Grid libre)

**Qué es:** superficie principal donde viven y se manipulan widgets.

**Responsabilidades MVP:**
- Renderizar widgets por layout
- Drag/resize estable
- Selección clara de widget
- Estado vacío claro cuando no hay widgets

**Regla técnica:** el canvas **no decide** lógica de negocio de guardado; solo emite cambios de layout.

---

### 4.5 Panel derecho (Inspector de propiedades)

**Qué es:** editor de propiedades del widget seleccionado.

**Responsabilidades:**
- Propiedades generales (id/tipo)
- Propiedades de layout (x, y, w, h)
- Propiedades schema-driven por widget

**Objetivo MVP:** mismo inspector para cualquier widget, sin crear panel manual por tipo.

---

### 4.6 Motor de widgets (registro modular)

**Qué es:** sistema extensible para agregar widgets sin romper existentes.

**Contrato por widget:**
- index (render)
- schema (propiedades)
- config (defaults)

**Regla de oro:** un widget nuevo no modifica otros widgets.

---

### 4.7 Estado (stores)

**Qué es:** capas de estado separadas para claridad.

**Capas recomendadas:**
- Estado de documento (layout, widgets, dirty)
- Estado de UI (panel activo, widget seleccionado, modales)
- Estado global de sesión (usuario, token, vars globales)

**Objetivo:** evitar mezclar estado visual con estado persistente.

---

### 4.8 Persistencia y autosave

**Qué es:** guardado confiable y predecible.

**MVP recomendado:**
- Debounce único (ej. 2s)
- Cola simple de guardado (evitar carreras)
- Mensajes de estado visibles

**Anti-patrón a evitar:** guardar desde múltiples lugares al mismo tiempo sin coordinación.

---

### 4.9 Modo App final

**Qué es:** experiencia limpia para usuario final, sin controles de edición.

**MVP:**
- Reusar render del layout
- Sin paneles del builder
- Respetar publicación/permisos

---

## 5) Plan por fases (ejecución recomendada)

### Estado actual de fases (actualizado: 2026-03-03)

- Fase 0 — **Completada** (contratos y decisiones base cerradas).
- Fase 1 — **Completada** (shell unificado con flujo de edición en una sola experiencia).
- Fase 2 — **Completada** (separación estado documento/UI y guardado unificado).
- Fase 3 — **Completada (MVP)** (Queries + JS Objects + ejecución manual de query).
- Fase 4 — **Completada** (estabilización UX/técnica, manejo de errores y validación operacional).

---

## Fase 0 — Alineación y contratos (1-2 días)

**Objetivo:** cerrar definiciones para no re-trabajar.

**Entregables:**
- Contrato de Shell Builder (zonas y responsabilidades)
- Contrato de eventos del canvas (onSelect, onLayoutChange, etc.)
- Contrato de guardado (quién guarda, cuándo, cómo)

**Checklist de cierre:**
- [ ] Decisión de arquitectura escrita y aprobada
- [ ] Flujo de guardado único definido
- [ ] Nombres/rutas base del editor definidos

### 5.0.1 Contrato A — Shell de Builder

**Ruta oficial de edición (MVP):**
- `/builder/:app-slug/:page-url`

**Objetivo del contrato:**
- Garantizar una estructura visual única para todo el modo edición.

**Zonas obligatorias:**
- `Topbar`: contexto (app/página), estado de guardado, acciones globales.
- `LeftPanel`: explorador con tabs `UI`, `Queries`, `JS`.
- `Canvas`: área principal de edición grid libre.
- `RightPanel`: inspector del elemento seleccionado.

**Responsabilidades por zona:**
- `Topbar` no renderiza contenido de widgets.
- `LeftPanel` no guarda layout; solo dispara acciones de navegación/selección/creación.
- `Canvas` no decide estrategia de persistencia; solo reporta cambios.
- `RightPanel` no conoce transporte/API; actualiza estado de documento.

**Estados visuales mínimos:**
- Carga inicial de página
- Error recuperable
- Sin widget seleccionado
- Sin widgets en canvas

**Criterios de aceptación del contrato A:**
- [ ] El usuario puede identificar siempre app y página activa.
- [ ] La distribución izquierda-centro-derecha no cambia entre páginas.
- [ ] No hay lógica de negocio duplicada entre paneles.

### 5.0.2 Contrato B — Eventos del Canvas (grid libre)

**Objetivo del contrato:**
- Estandarizar eventos del canvas para desacoplar UI y persistencia.

**Eventos base (semántica):**
- `onWidgetSelect(widgetId | null)`
- `onWidgetsAdd(widgetDraft)`
- `onWidgetsRemove(widgetId)`
- `onLayoutChange(layoutDelta)`
- `onWidgetConfigChange(widgetId, configPatch)`

**Reglas del contrato:**
- El canvas emite cambios en formato estable (delta o snapshot, pero uno solo).
- No se permite que el canvas llame directamente al endpoint de guardado.
- El canvas debe ser reutilizable en `isEditing=false` para modo app (solo lectura).

**Fuente de verdad del layout:**
- Estado de documento (store de documento).

**Criterios de aceptación del contrato B:**
- [ ] Cada interacción del usuario produce un evento explícito.
- [ ] No hay side effects de red dentro del canvas.
- [ ] El mismo motor renderiza builder y app final, variando solo el modo.

### 5.0.3 Contrato C — Guardado único (manual + autosave)

**Objetivo del contrato:**
- Tener una sola estrategia de persistencia para evitar conflictos y pérdida de estado.

**Reglas obligatorias:**
- Existe un único `SaveController` (hook o servicio) responsable de persistir.
- `autosave` y `manual save` usan el mismo pipeline interno.
- Debounce único para autosave: `2000ms` (MVP).
- Estado visual único: `idle | pending | saving | saved | error`.

**Flujo funcional (MVP):**
1. Cambio en documento -> marcar `dirty=true` y `pending`.
2. Debounce vencido -> ejecutar guardado.
3. Éxito -> `dirty=false`, `saved` temporal, luego `idle`.
4. Error -> `error`, mantener `dirty=true` para reintento.

**Manejo de concurrencia mínimo:**
- Si llega un cambio durante `saving`, marcar nueva versión `pending`.
- Al terminar guardado, si existe `pending`, lanzar siguiente guardado.

**Criterios de aceptación del contrato C:**
- [ ] No existen dos llamadas de guardado en paralelo para la misma página.
- [ ] El estado de guardado siempre coincide con lo que ve el usuario.
- [ ] Un error de red no borra cambios locales.

### 5.0.4 Decisiones cerradas de Fase 0

- **Layout oficial:** Grid libre.
- **Ruta oficial editor:** `/builder/:app-slug/:page-url`.
- **Fuente de verdad de documento:** store de documento.
- **Persistencia:** SaveController único con debounce de 2 segundos.

### 5.0.5 Firma de aprobación

- Estado: `Pendiente` -> `Aprobado`
- Fecha de aprobación: `_03___/_03___/__2026____`
- Responsable: `__John__________________`
- Notas: `_____________________________________________`

---

## Fase 1 — Reorganización de UI base (3-5 días)

**Objetivo:** ordenar la experiencia del editor sin agregar features complejas.

**Alcance:**
- Montar Shell unificado
- Integrar panel izquierdo por secciones (UI/Queries/JS)
- Integrar panel derecho inspector en layout estable

**Checklist de cierre:**
- [ ] Navegación coherente dentro del builder
- [ ] Usuario identifica app/página activa siempre
- [ ] Canvas central queda como foco principal

---

## Fase 2 — Refactor de estado y guardado (3-5 días)

**Objetivo:** eliminar acoplamientos y duplicidades técnicas.

**Alcance:**
- Separar store de documento y store de UI
- Unificar autosave/manual save en un solo controlador
- Manejo de error de persistencia consistente

**Checklist de cierre:**
- [ ] No hay doble guardado por mismo cambio
- [ ] `isDirty` refleja estado real
- [ ] Guardado/errores son trazables

---

## Fase 3 — Explorador funcional mínimo (4-6 días)

**Objetivo:** dar estructura operativa tipo Appsmith, versión MVP.

**Alcance:**
- Tab UI: árbol básico de widgets
- Tab Queries: listado/alta/edición mínima
- Tab JS: listado/alta/edición mínima

**Checklist de cierre:**
- [ ] Se puede crear y ubicar query por página
- [ ] Se puede crear función JS por página
- [ ] El panel izquierdo actúa como centro de trabajo

---

## Fase 4 — Estabilización MVP (3-4 días)

**Objetivo:** dejar base sólida para sumar widgets y datos.

**Alcance:**
- Consistencia visual y responsive
- Validación de flujos críticos
- Documentación mínima de operación del builder

**Checklist de cierre:**
- [ ] Edición, guardado y preview estables
- [ ] Errores comunes manejados sin romper sesión
- [ ] Documentación de uso interno actualizada

### Checklist de cierre Fase 4 (ejecutado)

- [x] Tabs principales del builder estables (`Pages | UI | Data`) sin intermitencia.
- [x] Sincronización URL <-> estado UI estable (`tab`, `dataTab`) sin loops.
- [x] Guardado manual + autosave funcionando sobre un único controlador.
- [x] Mensajería de estado de guardado visible y consistente (`idle/pending/saving/saved/error`).
- [x] CRUD básico de Queries operativo (crear, editar, eliminar, listar).
- [x] Ejecución manual de Query (`Run`) con resultado visible en panel.
- [x] CRUD básico de JS Objects operativo (crear, editar, eliminar, listar).
- [x] Manejo de error recuperable en Data panel con reintento manual y automático.
- [x] Endpoints críticos de datos validados en entorno local (`200` esperado en estado saludable).
- [x] Typecheck del proyecto sin errores (`npx tsc --noEmit`).

### Smoke tests MVP (corrida rápida recomendada)

1. **Abrir editor por ruta oficial**
	- Ir a `/builder/:app-slug/:page-url`.
	- Esperado: render completo de Topbar, LeftPanel, Canvas y RightPanel.

2. **Navegación de tabs principales**
	- Alternar `Pages`, `UI`, `Data` repetidamente.
	- Esperado: no hay rebotes ni bloqueo de selección.

3. **Sincronización con URL**
	- Cambiar `tab` y `dataTab` desde UI.
	- Recargar navegador.
	- Esperado: la selección previa se restaura correctamente.

4. **Edición y guardado documento**
	- Mover o redimensionar un widget.
	- Esperado: estado pasa por `pending/saving/saved` y persiste tras recarga.

5. **Queries CRUD + Run**
	- Crear query nueva, editar nombre/contenido, ejecutar `Run`, eliminar.
	- Esperado: lista actualiza en cada operación y `Run` muestra resultado o error controlado.

6. **JS Objects CRUD**
	- Crear JS Object, editar contenido, eliminar.
	- Esperado: operaciones reflejadas sin dejar error residual en pantalla.

7. **Recuperación ante error temporal backend**
	- Simular caída/reinicio de server dev y volver a levantar.
	- Esperado: panel `Data` se recupera con reintento y limpia mensajes de error persistente.

8. **Verificación técnica mínima**
	- Ejecutar `npx tsc --noEmit`.
	- Esperado: sin errores de TypeScript.

---

## 6) Orden recomendado de componentes (para trabajar por partes)

1. Shell Builder
2. Topbar contextual
3. Panel izquierdo (estructura)
4. Canvas (ajustes de contrato, no rediseño)
5. Inspector (uniformidad schema-driven)
6. Store documento/UI
7. Guardado/autosave
8. Queries MVP
9. JS MVP
10. Hardening y documentación

---

## 7) Criterios de “MVP listo”

- El editor tiene una estructura clara y consistente (izquierda-centro-derecha).
- El grid libre funciona con guardado confiable y mensajes de estado.
- Hay organización mínima para UI, Queries y JS por página.
- Builder y App final están claramente separados en experiencia.
- Agregar widgets sigue siendo modular y predecible.

---

## 8) Riesgos y mitigaciones

### Riesgo: sobrecargar la Fase 1 con funcionalidades
**Mitigación:** Fase 1 solo estructura y navegación, no lógica avanzada.

### Riesgo: deuda por mezcla de estado UI/documento
**Mitigación:** separar stores en Fase 2 antes de ampliar features.

### Riesgo: inestabilidad por guardado duplicado
**Mitigación:** centralizar persistencia en un único controlador de guardado.

### Riesgo: inconsistencia visual
**Mitigación:** migrar gradualmente a primitives/tokens del sistema UI.

---

## 9) Backlog inmediato (sprint sugerido)

### Sprint A (organización)
- Definir contratos y estructura del Shell
- Implementar layout de trabajo estable
- Conectar paneles básicos

### Sprint B (consistencia técnica)
- Refactor de stores
- Guardado único + debounce + estado visual
- Ajustes de errores y feedback

### Sprint C (operación mínima Appsmith-like)
- Queries tab MVP
- JS tab MVP
- Integración mínima con widgets (referencias)

---

## 10) Nota de alcance

Este plan prioriza **orden y arquitectura** antes de expansión funcional. Una vez completado, se recomienda abrir un documento separado para: widgets básicos (Texto, Imagen, Botón, etc.) y luego fase de datos (fuentes + queries avanzadas).

---

**Documento de trabajo vivo**
Actualiza este plan al cierre de cada fase con: fecha, estado, bloqueos y siguiente paso.
