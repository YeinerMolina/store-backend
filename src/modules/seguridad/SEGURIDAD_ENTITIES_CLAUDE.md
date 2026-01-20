# Entidades del Módulo SEGURIDAD

**Contexto**: SEGURIDAD  
**Archivo de Lógica**: `SEGURIDAD_CLAUDE.md`

---

## Entidades

1. Perfil
2. Permiso
3. PerfilPermiso
4. EmpleadoPerfil

---

## 1. Perfil

| Campo                | Tipo         | Restricciones             | Descripción      |
| -------------------- | ------------ | ------------------------- | ---------------- |
| `id`                 | uuid         | PK                        |                  |
| `nombre`             | varchar(100) | not null, unique          | Nombre del rol   |
| `descripcion`        | text         | nullable                  |                  |
| `estado`             | enum         | not null, default: ACTIVO | ACTIVO, INACTIVO |
| `fecha_creacion`     | timestamp    | not null, default: now()  |                  |
| `fecha_modificacion` | timestamp    | not null                  |                  |

**Constraints**:

- Unique: `nombre`

---

## 2. Permiso

| Campo            | Tipo         | Restricciones            | Descripción                                         |
| ---------------- | ------------ | ------------------------ | --------------------------------------------------- |
| `id`             | uuid         | PK                       |                                                     |
| `clave`          | varchar(50)  | not null, unique         | Identificador único                                 |
| `nombre`         | varchar(100) | not null                 | Nombre descriptivo                                  |
| `descripcion`    | text         | nullable                 |                                                     |
| `categoria`      | enum         | not null                 | INVENTARIO, VENTAS, CAMBIOS, CONFIG, NOTIFICACIONES |
| `es_sensible`    | boolean      | not null, default: false | Requiere auditoría especial                         |
| `fecha_creacion` | timestamp    | not null, default: now() |                                                     |

**Constraints**:

- Unique: `clave`

**Enums**:

```sql
CREATE TYPE categoria_permiso AS ENUM ('INVENTARIO', 'VENTAS', 'CAMBIOS', 'CONFIG', 'NOTIFICACIONES');
```

**Nota**: `NOTIFICACIONES` es NUEVO en v2.1.

---

## 3. PerfilPermiso

| Campo              | Tipo      | Restricciones            | Descripción |
| ------------------ | --------- | ------------------------ | ----------- |
| `id`               | uuid      | PK                       |             |
| `perfil_id`        | uuid      | FK, not null             |             |
| `permiso_id`       | uuid      | FK, not null             |             |
| `fecha_asignacion` | timestamp | not null, default: now() |             |

**Constraints**:

- FK: `perfil_id` → `perfil(id)`
- FK: `permiso_id` → `permiso(id)`
- Unique: `(perfil_id, permiso_id)`

---

## 4. EmpleadoPerfil

| Campo              | Tipo      | Restricciones             | Descripción         |
| ------------------ | --------- | ------------------------- | ------------------- |
| `id`               | uuid      | PK                        |                     |
| `empleado_id`      | uuid      | FK, not null              |                     |
| `perfil_id`        | uuid      | FK, not null              |                     |
| `estado`           | enum      | not null, default: ACTIVA | ACTIVA, REVOCADA    |
| `asignado_por`     | uuid      | FK, not null              | Empleado que asignó |
| `fecha_asignacion` | timestamp | not null, default: now()  |                     |
| `fecha_revocacion` | timestamp | nullable                  |                     |

**Constraints**:

- FK: `empleado_id` → `empleado(id)`
- FK: `perfil_id` → `perfil(id)`
- FK: `asignado_por` → `empleado(id)`

**Enums**:

```sql
CREATE TYPE estado_asignacion AS ENUM ('ACTIVA', 'REVOCADA');
```

**Índices**:

```sql
CREATE INDEX idx_empleado_perfil ON empleado_perfil (empleado_id, perfil_id);
CREATE INDEX idx_empleado_perfil_estado ON empleado_perfil (estado);
```

---

**Referencia**: Ver `SEGURIDAD_CLAUDE.md`
