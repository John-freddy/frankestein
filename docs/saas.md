# Capas necesarias para que un Low-Code soporte SaaS (Multi-Tenant)

*(Excluyendo billing)*

---

# 1. Capa de Multi-Tenancy de Datos

Permite que múltiples organizaciones utilicen la misma aplicación sin mezclar información.

## Características

- Campo `organization_id` (o similar) en las tablas
- Filtrado automático por tenant
- Autenticación que determine el tenant activo
- Aislamiento lógico de datos

## Ejemplo

Tabla `leads`

| id | name | organization_id |
|----|------|----------------|
| 1 | Juan | org_A |
| 2 | Pedro | org_B |

El frontend solo muestra datos del `organization_id` del usuario autenticado.

---

# 2. Capa de Navegación y Permisos de Módulos

Permite controlar **qué partes de la aplicación puede ver cada usuario o plan**.

## Problema en herramientas como Appsmith

- Los menús no están centralizados
- Las páginas se crean de forma independiente

## Solución

Crear un **sistema de navegación centralizado**.

### Tabla `modules`

| id | name | route |
|----|------|------|
| 1 | Leads | /leads |
| 2 | Tickets | /tickets |
| 3 | Reportes | /reports |

### Tabla `module_permissions`

| role | module_id |
|------|-----------|
| admin | 1 |
| admin | 2 |
| admin | 3 |
| agent | 1 |

El frontend **renderiza el menú dinámicamente**.

---

# 3. Capa de Componentes / Widgets Especializados

Permite renderizar funcionalidades complejas **sin programarlas cada vez**.

## Problema

En Appsmith muchas funcionalidades requieren **custom widgets**.

Ejemplos:

- embudos
- kanban
- timelines
- dashboards
- workflows

## Solución

Crear **widgets reutilizables parametrizados**.

Ejemplo conceptual:

```
FunnelWidget(config)
```

Configuración:

```
steps:
 - Prospecto
 - Contactado
 - Negociación
 - Cierre
```

El widget se alimenta de la configuración almacenada en la base de datos.

---

# 4. Capa de UI Dinámica basada en Configuración

Permite que la interfaz **se genere a partir de configuraciones**.

## Ejemplo clásico

Formularios dinámicos.

Tabla `form_fields`

| form | field | type |
|------|------|------|
| lead | name | text |
| lead | email | email |
| lead | sector | select |

El frontend ejecuta algo como:

```
renderForm(fields)
```

Esto permite que cada tenant tenga **formularios distintos**.

---

# 5. Capa de Reglas de Negocio Declarativas

Permite modificar comportamientos **sin tocar código**.

Se implementa mediante un **motor de reglas**.

## Ejemplo

Regla:

```
IF monto > 10000
THEN require_manager_approval = true
```

El frontend consulta:

```
rules_engine.evaluate(context)
```

## Librerías posibles

NodeJS:

- json-rules-engine
- durable-rules
- node-rules

---

# 6. Capa de Personalización Visual (Tenant Branding)

Permite que cada cliente vea **su propia marca**.

## Configuración por tenant

Tabla `organization_settings`

| organization | logo | primary_color |
|--------------|------|---------------|
| org_A | logoA.png | #0033FF |
| org_B | logoB.png | #FF0000 |

## Personalizaciones posibles

- logo
- colores
- favicon
- fuentes
- textos
- layout
- CSS personalizado

---

# 7. Capa de Auditoría y Gobernanza

Permite controlar actividad y seguridad en ambientes multi-tenant.

## Funciones

- logs por tenant
- historial de acciones
- auditoría de cambios
- métricas de uso
- trazabilidad

## Ejemplo

Tabla `audit_logs`

| user | action | entity | timestamp |
|------|--------|--------|-----------|
| user1 | create | lead | 2026-03-04 |

---

# Arquitectura conceptual

```
              SaaS Platform
                   │
        ┌──────────┼──────────┐
        │          │          │
   Multi-Tenant   UI        Business
     Data        Layer        Logic
        │          │          │
        │          │          │
  organization_id  menus   rules engine
                   widgets
                   forms
                   branding
```

---

# Conclusión

Para que una plataforma **low-code tipo Appsmith soporte SaaS**, necesita al menos:

1. Multi-tenancy de datos  
2. Navegación centralizada con permisos  
3. Widgets reutilizables  
4. UI dinámica basada en configuración  
5. Motor de reglas de negocio  
6. Personalización visual por tenant  
7. Auditoría y gobernanza  

Con estas capas, la herramienta deja de ser solo **internal tools** y pasa a ser **infraestructura SaaS**.