# Anatomía de un Low-Code Builder para SaaS - Claude

> Enfoque: Solo la capa de **construcción visual** de aplicaciones.  
> Excluido: Backend, infraestructura, pricing/billing.

---

## 1. BUILDER (El IDE / Entorno de Trabajo)

El Builder es **todo lo que rodea al canvas**: la experiencia de gestionar, configurar y publicar una aplicación.

### 1.1 Gestión de Proyecto

| Capacidad | Qué significa | Prioridad Frankenstein |
|-----------|--------------|----------------------|
| Crear / clonar / archivar apps | CRUD básico de proyectos | **P0 - Día 1** |
| Multi-página / pantallas | Cada app tiene N páginas con rutas | **P0 - Día 1** |
| Navegación entre páginas | Definir menú, sidebar, rutas | **P0 - Día 1** |
| Variables globales de app | Estado compartido entre páginas | **P1 - Pronto** |
| Versionamiento / historial | Guardar snapshots, rollback | P2 - Después |
| Branching (como Git) | Ramas para experimentar cambios | P3 - Lujo |

### 1.2 Conexión a Datos

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Configurar REST APIs | URL base, headers, auth tokens | **P0 - Día 1** |
| Query builder visual | Armar requests GET/POST sin código | **P0 - Día 1** |
| Transformaciones de respuesta | Mapear JSON de respuesta a variables | **P1 - Pronto** |
| GraphQL support | Queries y mutations | P2 - Después |
| WebSocket / real-time | Suscripciones a datos en vivo | P3 - Lujo |
| Conexión directa a DB | Query SQL desde el builder | P3 - Lujo (riesgo seguridad) |

### 1.3 Estado y Lógica del Frontend

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Variables de página | Estado local por pantalla | **P0 - Día 1** |
| Binding de datos | Conectar variable → widget | **P0 - Día 1** |
| Eventos / acciones | onClick → ejecutar query, navegar, etc. | **P0 - Día 1** |
| Lógica condicional | Mostrar/ocultar según condición | **P0 - Día 1** |
| JavaScript inline | Expresiones `{{ }}` para transformar datos | **P1 - Pronto** |
| Cadenas de acciones | Acción 1 → si éxito → Acción 2 → si falla → Acción 3 | **P1 - Pronto** |
| Store global (tipo Zustand) | Estado compartido entre componentes | P2 - Después |

### 1.4 Temas y Branding

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Paleta de colores global | Primary, secondary, neutrals | **P1 - Pronto** |
| Tipografía base | Font family, sizes, weights | **P1 - Pronto** |
| Logo y favicon | Identidad de la app | **P1 - Pronto** |
| Temas predefinidos | Light/dark, variantes de color | P2 - Después |
| CSS custom global | Override de estilos base | P2 - Después |

### 1.5 Preview y Publicación

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Preview en vivo | Ver la app funcionando dentro del builder | **P0 - Día 1** |
| Publicar a producción | Un click → app desplegada | **P0 - Día 1** |
| Ambientes (dev/staging/prod) | Distintas configs por ambiente | P2 - Después |
| Custom domains | Apuntar dominio propio a la app | P2 - Después |
| PWA / mobile | Exportar como app instalable | P3 - Lujo |

---

## 2. CANVAS (El Espacio de Trabajo Visual)

El Canvas es **donde se diseña la interfaz**: el área donde arrastras, colocas y organizas los widgets.

### 2.1 Motor de Layout

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Sistema de grillas / columnas | 12-column grid o similar | **P0 - Día 1** |
| Containers anidados | Div dentro de div con layout propio | **P0 - Día 1** |
| Flexbox visual | Dirección, alineación, gap sin CSS | **P0 - Día 1** |
| Auto-layout | Los hijos se acomodan automáticamente | **P0 - Día 1** |
| Breakpoints responsive | Desktop / tablet / mobile | **P1 - Pronto** |
| Grid CSS visual | Filas y columnas tipo CSS Grid | P2 - Después |
| Posicionamiento absoluto | Drag libre sin restricciones | P3 - Lujo (crea caos) |

### 2.2 Interacción con el Canvas

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Drag & drop de widgets | Arrastrar desde paleta al canvas | **P0 - Día 1** |
| Selección de elementos | Click para seleccionar, ver props | **P0 - Día 1** |
| Mover / reordenar | Drag para cambiar posición | **P0 - Día 1** |
| Copiar / pegar / duplicar | Ctrl+C, Ctrl+V entre widgets | **P1 - Pronto** |
| Undo / redo | Ctrl+Z con historial de acciones | **P1 - Pronto** |
| Multi-selección | Shift+click o lasso para seleccionar varios | P2 - Después |
| Zoom & pan | Acercar/alejar el canvas | P2 - Después |
| Snap / alignment guides | Líneas guía al mover elementos | P2 - Después |
| Keyboard shortcuts | Atajos para acciones comunes | P2 - Después |

### 2.3 Árbol de Componentes

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Panel de árbol jerárquico | Ver estructura padre→hijo en sidebar | **P0 - Día 1** |
| Renombrar nodos | Dar nombres legibles a los widgets | **P1 - Pronto** |
| Reordenar desde el árbol | Drag en el árbol = reordenar en canvas | **P1 - Pronto** |
| Buscar en el árbol | Encontrar widget por nombre | P2 - Después |
| Colapsar / expandir ramas | Manejar árboles grandes | P2 - Después |

### 2.4 Panel de Propiedades

| Capacidad | Qué significa | Prioridad |
|-----------|--------------|-----------|
| Props del widget seleccionado | Label, placeholder, valor, etc. | **P0 - Día 1** |
| Estilos inline | Padding, margin, color, border | **P0 - Día 1** |
| Binding visual | Conectar prop a variable/query con UI | **P0 - Día 1** |
| Eventos del widget | Configurar onClick, onChange, etc. | **P0 - Día 1** |
| Validaciones | Required, min/max, regex | **P1 - Pronto** |
| Condicionales de visibilidad | Mostrar si `{{ variable == true }}` | **P1 - Pronto** |
| Estilos condicionales | Color rojo si `{{ status == 'error' }}` | P2 - Después |

---

## 3. WIDGETS (Los Componentes / Bloques)

Los Widgets son **las piezas de LEGO**: cada elemento visual que el usuario coloca en el canvas.

### 3.1 Widgets Básicos (P0 - Día 1)

| Widget | Props principales | Eventos |
|--------|------------------|---------|
| **Text / Heading** | Contenido, nivel (h1-h6), alineación | - |
| **Button** | Label, variante (primary/secondary/ghost), icono, loading, disabled | onClick |
| **Image** | URL/upload, alt text, fit (cover/contain) | onClick |
| **Icon** | Librería de iconos, tamaño, color | onClick |
| **Link** | URL, texto, target (_blank/_self) | onClick |
| **Divider** | Orientación, grosor, color | - |
| **Spacer** | Altura fija | - |

### 3.2 Widgets de Formulario (P0 - Día 1)

| Widget | Props principales | Eventos |
|--------|------------------|---------|
| **Text Input** | Label, placeholder, tipo (text/email/password/number), valor default | onChange, onBlur, onSubmit |
| **Textarea** | Label, placeholder, rows, max length | onChange, onBlur |
| **Select / Dropdown** | Options (static/dynamic), placeholder, searchable | onChange |
| **Checkbox** | Label, checked default | onChange |
| **Radio Group** | Options, orientación (horizontal/vertical) | onChange |
| **Switch / Toggle** | Label, estado default | onChange |
| **Date Picker** | Formato, min/max date, rangos | onChange |
| **File Upload** | Tipos permitidos, tamaño máximo, múltiple | onUpload, onRemove |
| **Form Container** | Agrupa inputs, maneja validación colectiva | onSubmit, onReset |

### 3.3 Widgets de Datos (P0/P1)

| Widget | Props principales | Eventos | Prioridad |
|--------|------------------|---------|-----------|
| **Table** | Columnas, datos (query/static), paginación, ordenamiento, búsqueda | onRowClick, onSort, onPageChange | **P0** |
| **List / Repeater** | Template de item, datos, orientación | onItemClick | **P0** |
| **Detail / Card** | Campos mapeados, layout | onClick | **P1** |
| **Stat / KPI** | Valor, label, icono, tendencia | - | **P1** |
| **Pagination** | Total pages, current page | onPageChange | **P1** |

### 3.4 Widgets de Layout (P0/P1)

| Widget | Props principales | Prioridad |
|--------|------------------|-----------|
| **Container** | Dirección (row/col), alineación, gap, padding, bg | **P0** |
| **Columns** | Número de columnas, proporción (1/3 + 2/3, etc.) | **P0** |
| **Tabs** | Tab labels, tab activo por default | **P1** |
| **Modal / Dialog** | Trigger, tamaño, título, acciones | **P1** |
| **Drawer / Sidebar** | Posición (left/right), ancho | **P1** |
| **Accordion / Collapse** | Items, múltiple abierto | **P1** |
| **Card** | Header, body, footer, shadow, border | **P1** |

### 3.5 Widgets de Navegación (P1)

| Widget | Props principales |
|--------|------------------|
| **Navbar** | Logo, items de menú, user menu |
| **Sidebar Menu** | Items jerárquicos, colapsable |
| **Breadcrumbs** | Items (auto-generados o manuales) |
| **Steps / Wizard** | Pasos, paso actual, navegación |

### 3.6 Widgets de Visualización (P2 - Después)

| Widget | Props principales |
|--------|------------------|
| **Bar Chart** | Data, ejes, colores, stacked |
| **Line Chart** | Data, ejes, múltiples series |
| **Pie / Donut Chart** | Data, labels, colores |
| **Area Chart** | Data, ejes, fill |
| **Map** | Lat/lng, markers, zoom |
| **Calendar** | Eventos, vista (mes/semana/día) |
| **Timeline** | Items, orientación |
| **Rich Text Editor** | Toolbar config, contenido HTML |

### 3.7 Widgets Avanzados (P3 - Lujo)

| Widget | Descripción |
|--------|-------------|
| **Code Editor** | Monaco editor embebido |
| **JSON Viewer** | Visualizar JSON con collapse |
| **File Manager** | Browse archivos con tree view |
| **Chat / Comments** | Mensajes en tiempo real |
| **Kanban Board** | Columnas con drag & drop de cards |
| **Signature Pad** | Captura de firma digital |
| **QR Code** | Generar QR desde datos |
| **Audio / Video Player** | Reproductor de media |

---

## Arquitectura Técnica Recomendada para Frankenstein

### Cada Widget como Módulo

```
/widgets
  /text
    TextWidget.tsx        ← Componente de render (runtime)
    TextEditor.tsx        ← Componente del canvas (edición)
    text.config.ts        ← Schema de props + defaults
    text.icon.tsx         ← Icono para la paleta
    index.ts              ← Export del registro
```

### Schema de Widget (JSONB en PostgreSQL)

```json
{
  "id": "widget_abc123",
  "type": "text-input",
  "props": {
    "label": "Nombre del cliente",
    "placeholder": "Ingrese nombre...",
    "required": true,
    "value": "{{ formData.clientName }}"
  },
  "style": {
    "width": "100%",
    "marginBottom": "16px"
  },
  "events": {
    "onChange": {
      "type": "setState",
      "target": "formData.clientName",
      "value": "{{ $event.value }}"
    }
  },
  "visibility": "{{ currentStep === 1 }}",
  "children": []
}
```

### Página Completa (JSONB)

```json
{
  "id": "page_vacation_request",
  "name": "Solicitud de Vacaciones",
  "route": "/vacaciones/nueva",
  "layout": {
    "type": "container",
    "props": { "direction": "column", "gap": "24px", "padding": "24px" },
    "children": [
      {
        "type": "heading",
        "props": { "level": 2, "content": "Nueva Solicitud de Vacaciones" }
      },
      {
        "type": "form-container",
        "props": {},
        "events": {
          "onSubmit": {
            "type": "apiCall",
            "query": "createVacationRequest",
            "onSuccess": { "type": "navigate", "to": "/vacaciones" }
          }
        },
        "children": [
          {
            "type": "columns",
            "props": { "columns": 2 },
            "children": [
              {
                "type": "date-picker",
                "props": { "label": "Fecha inicio", "value": "{{ form.startDate }}" }
              },
              {
                "type": "date-picker",
                "props": { "label": "Fecha fin", "value": "{{ form.endDate }}" }
              }
            ]
          },
          {
            "type": "textarea",
            "props": { "label": "Motivo", "rows": 3, "value": "{{ form.reason }}" }
          },
          {
            "type": "button",
            "props": { "label": "Enviar Solicitud", "variant": "primary", "loading": "{{ queries.createVacationRequest.isLoading }}" }
          }
        ]
      }
    ]
  },
  "queries": {
    "createVacationRequest": {
      "type": "REST",
      "method": "POST",
      "url": "{{ env.API_BASE }}/items/vacation_requests",
      "body": "{{ form }}"
    }
  },
  "variables": {
    "form": {
      "startDate": null,
      "endDate": null,
      "reason": ""
    }
  }
}
```

---

## Roadmap Sugerido

### Fase 1 — MVP Funcional (4-6 semanas)
- Builder: CRUD de apps y páginas, conexión a APIs REST, variables de página
- Canvas: Drag & drop básico, árbol de componentes, panel de propiedades
- Widgets: Container, Columns, Text, Button, Input, Select, Table, Form Container

### Fase 2 — Usable en Producción (4-6 semanas más)
- Builder: Temas, preview en vivo, publicación, lógica condicional
- Canvas: Undo/redo, copy/paste, responsive breakpoints
- Widgets: Todos los de formulario, Modal, Tabs, Drawer, Stats

### Fase 3 — Diferenciador (ongoing)
- Builder: Versionamiento, ambientes, colaboración
- Canvas: Zoom, snap guides, shortcuts
- Widgets: Charts, Calendar, Rich Text Editor, Kanban

---

## Qué tienen las plataformas existentes (benchmark)

| Capacidad | Appsmith | Retool | Mendix | Budibase |
|-----------|----------|--------|--------|----------|
| Drag & drop canvas | ✅ Grid fijo | ✅ Grid fijo | ✅ Flex libre | ✅ Grid fijo |
| Árbol de componentes | ✅ | ✅ | ✅ | ✅ |
| Binding `{{ }}` | ✅ JS | ✅ JS | ❌ (visual) | ✅ Handlebars |
| Widgets de form | ~20 | ~25 | ~30 | ~15 |
| Table avanzada | ✅✅ | ✅✅✅ | ✅✅ | ✅ |
| Charts | ✅ | ✅ | ✅ | Plugin |
| REST API config | ✅ | ✅ | ✅ | ✅ |
| GraphQL | ✅ | ✅ | ❌ | ❌ |
| Mobile / responsive | Limitado | Limitado | ✅✅✅ | Limitado |
| Temas custom | Básico | Básico | ✅✅ | Básico |
| Versionamiento | Git sync | Git sync | ✅ Built-in | ❌ |
| Self-hosted | ✅ | ✅ (Enterprise) | ✅ (caro) | ✅ |
| Open source | ✅ | ❌ | ❌ | ✅ |