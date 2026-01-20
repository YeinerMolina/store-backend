# Módulo SEGURIDAD

**Contexto**: SEGURIDAD  
**Responsabilidad**: Perfiles, permisos y control de acceso  
**Archivo de Entidades**: `SEGURIDAD_ENTITIES_CLAUDE.md`

---

## Visión

Control de acceso basado en roles (RBAC). Los empleados tienen perfiles, los perfiles tienen permisos.

---

## Responsabilidades

1. **Gestión de Perfiles**: Roles del sistema (Vendedor, Supervisor, Administrador)
2. **Gestión de Permisos**: Acciones específicas del sistema
3. **Asignación**: Vincular empleados con perfiles

---

## Agregado: Perfil

**Root**: Perfil  
**Entidades**: PerfilPermiso

**Invariantes**:

- Un perfil puede tener múltiples permisos
- Un empleado puede tener múltiples perfiles
- Solo asignaciones ACTIVAS otorgan acceso

---

## Agregado: Permiso

**Root**: Permiso (catálogo inmutable)

**Categorías de Permisos**:

- INVENTARIO: Ajustes, consultas
- VENTAS: Crear ventas, cancelar
- CAMBIOS: Aprobar, rechazar
- CONFIG: Modificar parámetros
- NOTIFICACIONES: Ver notificaciones operativas (NUEVO v2.1)

---

## Casos de Uso

### CU-SEG-01: Crear Perfil

**Actor**: Empleado (con permiso GESTIONAR_PERFILES)

**Flujo**:

1. Empleado crea perfil con nombre y descripción
2. Empleado selecciona permisos a asignar
3. Sistema crea Perfil + PerfilPermiso
4. Evento: `PerfilCreado`

---

### CU-SEG-02: Asignar Perfil a Empleado

**Actor**: Empleado (con permiso ASIGNAR_PERFILES)

**Flujo**:

1. Empleado selecciona empleado destino y perfil
2. Sistema valida que empleado esté ACTIVO
3. Sistema crea EmpleadoPerfil (estado ACTIVA)
4. Evento: `PerfilAsignado`

---

### CU-SEG-03: Revocar Perfil

**Actor**: Empleado (con permiso ASIGNAR_PERFILES)

**Flujo**:

1. Empleado selecciona asignación activa
2. Sistema cambia estado a REVOCADA
3. Sistema registra fecha_revocacion
4. Evento: `PerfilRevocado`

---

### CU-SEG-04: Verificar Permiso

**Actor**: Sistema (en cada operación protegida)

**Flujo**:

1. Sistema recibe request de empleado
2. Sistema obtiene perfiles ACTIVOS del empleado
3. Sistema verifica si algún perfil tiene el permiso requerido
4. Si NO → rechazar operación
5. Si SÍ → permitir

---

## Reglas de Negocio

### RN-SEG-01: Permisos Sensibles

Permisos marcados como `es_sensible` requieren auditoría especial.

### RN-SEG-02: Múltiples Perfiles

Un empleado puede tener múltiples perfiles simultáneamente (union de permisos).

---

## Eventos

| Evento           | Cuándo                | Payload                |
| ---------------- | --------------------- | ---------------------- |
| `PerfilCreado`   | Al crear perfil       | perfil_id, nombre      |
| `PerfilAsignado` | Al asignar a empleado | empleado_id, perfil_id |
| `PerfilRevocado` | Al revocar            | empleado_id, perfil_id |

---

## Permisos del Sistema (Ejemplos)

| Clave                           | Categoría      | Descripción                       |
| ------------------------------- | -------------- | --------------------------------- |
| `GESTIONAR_CATALOGO`            | CATALOGO       | Crear/modificar productos         |
| `AJUSTAR_INVENTARIO`            | INVENTARIO     | Ajustes manuales                  |
| `CREAR_VENTA`                   | VENTAS         | Crear ventas                      |
| `APROBAR_CAMBIO`                | CAMBIOS        | Aprobar cambios                   |
| `CONFIG_SISTEMA`                | CONFIG         | Modificar parámetros              |
| `VER_NOTIFICACIONES_OPERATIVAS` | NOTIFICACIONES | Ver notif operativas (NUEVO v2.1) |

---

## Integraciones

### PROVEE a:

- TODOS LOS MÓDULOS: Verificación de permisos

### CONSUME de:

- IDENTIDAD: Empleado

---

**Referencia**: Ver `SEGURIDAD_ENTITIES_CLAUDE.md`
