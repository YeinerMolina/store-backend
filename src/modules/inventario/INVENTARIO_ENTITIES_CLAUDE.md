# Entidades del Módulo INVENTARIO

**Contexto**: INVENTARIO  
**Archivo de Lógica**: `INVENTARIO_CLAUDE.md`

---

## Entidades

1. Inventario
2. Reserva
3. MovimientoInventario

---

## 1. Inventario

| Campo                 | Tipo        | Restricciones        | Descripción           |
| --------------------- | ----------- | -------------------- | --------------------- |
| `id`                  | uuid        | PK                   | Identificador único   |
| `tipo_item`           | enum        | not null             | PRODUCTO, PAQUETE     |
| `item_id`             | uuid        | not null             | FK polim\u00f3rfica   |
| `ubicacion`           | varchar(50) | nullable             | Ubicaci\u00f3n física |
| `cantidad_disponible` | int         | not null, default: 0 | Stock libre           |
| `cantidad_reservada`  | int         | not null, default: 0 | Stock reservado       |
| `cantidad_abandono`   | int         | not null, default: 0 | Stock en abandono     |
| `version`             | int         | not null, default: 1 | Control concurrencia  |
| `fecha_actualizacion` | timestamp   | not null             | Última actualización  |

**Constraints**:

- Unique: `(tipo_item, item_id)`
- Check: `cantidad_disponible >= 0`
- Check: `cantidad_reservada >= 0`

**Índices**:

```sql
CREATE UNIQUE INDEX idx_inventario_item ON inventario (tipo_item, item_id);
CREATE INDEX idx_inventario_ubicacion ON inventario (ubicacion);
```

---

## 2. Reserva

| Campo              | Tipo      | Restricciones             | Descripción                             |
| ------------------ | --------- | ------------------------- | --------------------------------------- |
| `id`               | uuid      | PK                        | Identificador único                     |
| `inventario_id`    | uuid      | FK, not null              | Inventario reservado                    |
| `tipo_operacion`   | enum      | not null                  | VENTA, CAMBIO                           |
| `operacion_id`     | uuid      | not null                  | ID de venta o cambio                    |
| `cantidad`         | int       | not null                  | Cantidad reservada                      |
| `estado`           | enum      | not null, default: ACTIVA | ACTIVA, CONSOLIDADA, LIBERADA, EXPIRADA |
| `fecha_creacion`   | timestamp | not null, default: now()  |                                         |
| `fecha_expiracion` | timestamp | not null                  | creacion + 20 min                       |
| `fecha_resolucion` | timestamp | nullable                  | Cuándo se resolvió                      |
| `actor_tipo`       | enum      | not null                  | EMPLEADO, CLIENTE, SISTEMA              |
| `actor_id`         | uuid      | not null                  | Quién la creó                           |

**Constraints**:

- FK: `inventario_id` → `inventario(id)`

**Índices**:

```sql
CREATE INDEX idx_reserva_inventario ON reserva (inventario_id);
CREATE INDEX idx_reserva_estado ON reserva (estado);
CREATE INDEX idx_reserva_expiracion ON reserva (fecha_expiracion, estado);
CREATE INDEX idx_reserva_operacion ON reserva (operacion_id);
```

---

## 3. MovimientoInventario

| Campo                   | Tipo         | Restricciones            | Descripción                                          |
| ----------------------- | ------------ | ------------------------ | ---------------------------------------------------- |
| `id`                    | uuid         | PK                       | Identificador único                                  |
| `inventario_id`         | uuid         | FK, not null             | Inventario afectado                                  |
| `tipo_movimiento`       | enum         | not null                 | VENTA_SALIDA, CAMBIO_ENTRADA, AJUSTE_OPERATIVO, etc. |
| `cantidad`              | int          | not null                 | Cantidad del movimiento                              |
| `cantidad_anterior`     | int          | not null                 | Estado antes                                         |
| `cantidad_posterior`    | int          | not null                 | Estado después                                       |
| `tipo_operacion_origen` | enum         | nullable                 | VENTA, CAMBIO, AJUSTE                                |
| `operacion_origen_id`   | uuid         | nullable                 | ID de operación origen                               |
| `empleado_id`           | uuid         | FK nullable              | Empleado si ajuste manual                            |
| `intencion`             | varchar(200) | nullable                 | Razón del movimiento                                 |
| `notas`                 | text         | nullable                 | Observaciones                                        |
| `fecha_movimiento`      | timestamp    | not null, default: now() |                                                      |

**Constraints**:

- FK: `inventario_id` → `inventario(id)`
- FK: `empleado_id` → `empleado(id)`

**Nota**: Tabla INSERT-only (inmutable).

**Índices**:

```sql
CREATE INDEX idx_movimiento_inventario ON movimiento_inventario (inventario_id);
CREATE INDEX idx_movimiento_fecha ON movimiento_inventario (fecha_movimiento);
CREATE INDEX idx_movimiento_tipo ON movimiento_inventario (tipo_movimiento);
```

---

## Enums

```sql
CREATE TYPE tipo_item AS ENUM ('PRODUCTO', 'PAQUETE');
CREATE TYPE tipo_operacion AS ENUM ('VENTA', 'CAMBIO', 'AJUSTE');
CREATE TYPE estado_reserva AS ENUM ('ACTIVA', 'CONSOLIDADA', 'LIBERADA', 'EXPIRADA');
CREATE TYPE tipo_movimiento AS ENUM (
  'VENTA_SALIDA',
  'CAMBIO_SALIDA',
  'CAMBIO_ENTRADA',
  'AJUSTE_OPERATIVO',
  'AJUSTE_CONTABLE',
  'RESERVA',
  'LIBERACION',
  'ABANDONO_ENTRADA',
  'ABANDONO_SALIDA'
);
CREATE TYPE tipo_actor AS ENUM ('EMPLEADO', 'CLIENTE', 'SISTEMA');
```

---

**Referencia**: Ver `INVENTARIO_CLAUDE.md` para lógica de negocio.
