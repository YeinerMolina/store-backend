# Entidades del Módulo PRE-VENTA

**Contexto**: PRE_VENTA  
**Archivo de Lógica**: `PRE_VENTA_CLAUDE.md`

**NUEVO en v2.1**

---

## Entidades

1. Carrito
2. ItemCarrito
3. ListaDeseos
4. ItemListaDeseos
5. PreferenciaNotificacion

---

## 1. Carrito

| Campo                | Tipo      | Restricciones             | Descripción                    |
| -------------------- | --------- | ------------------------- | ------------------------------ |
| `id`                 | uuid      | PK                        | Identificador único            |
| `cliente_id`         | uuid      | FK, not null              | Cliente dueño del carrito      |
| `empleado_id`        | uuid      | FK nullable               | Solo si FISICO                 |
| `tipo_carrito`       | enum      | not null                  | DIGITAL, FISICO                |
| `estado`             | enum      | not null, default: ACTIVO | ACTIVO, CONVERTIDO, ABANDONADO |
| `fecha_creacion`     | timestamp | not null, default: now()  |                                |
| `fecha_modificacion` | timestamp | not null                  |                                |
| `fecha_conversion`   | timestamp | nullable                  | Cuándo se convirtió a venta    |
| `venta_id`           | uuid      | nullable                  | Venta resultante               |

**Constraints**:

- FK: `cliente_id` → `cliente(id)`
- FK: `empleado_id` → `empleado(id)`
- Unique parcial: `(cliente_id)` WHERE `estado = 'ACTIVO'` AND `tipo_carrito = 'DIGITAL'`

**Índices**:

```sql
CREATE UNIQUE INDEX idx_carrito_activo_cliente
ON carrito (cliente_id)
WHERE estado = 'ACTIVO' AND tipo_carrito = 'DIGITAL';

CREATE INDEX idx_carrito_estado ON carrito (estado);
```

**Enums**:

```sql
CREATE TYPE tipo_carrito AS ENUM ('DIGITAL', 'FISICO');
CREATE TYPE estado_carrito AS ENUM ('ACTIVO', 'CONVERTIDO', 'ABANDONADO');
```

---

## 2. ItemCarrito

| Campo                | Tipo          | Restricciones            | Descripción              |
| -------------------- | ------------- | ------------------------ | ------------------------ |
| `id`                 | uuid          | PK                       | Identificador único      |
| `carrito_id`         | uuid          | FK, not null             | Carrito al que pertenece |
| `tipo_item`          | enum          | not null                 | PRODUCTO, PAQUETE        |
| `item_id`            | uuid          | not null                 | FK polimórfica           |
| `cantidad`           | int           | not null                 | Cantidad deseada         |
| `precio_referencial` | decimal(12,2) | not null                 | Snapshot informativo     |
| `fecha_agregado`     | timestamp     | not null, default: now() |                          |
| `fecha_modificacion` | timestamp     | not null                 |                          |

**Constraints**:

- FK: `carrito_id` → `carrito(id)` ON DELETE CASCADE
- Check: `cantidad > 0`

**Índices**:

```sql
CREATE INDEX idx_item_carrito_carrito ON item_carrito (carrito_id);
CREATE INDEX idx_item_carrito_item ON item_carrito (tipo_item, item_id);
```

**Nota**: `precio_referencial` NO es contractual, es solo informativo.

---

## 3. ListaDeseos

| Campo                | Tipo         | Restricciones             | Descripción              |
| -------------------- | ------------ | ------------------------- | ------------------------ |
| `id`                 | uuid         | PK                        | Identificador único      |
| `cliente_id`         | uuid         | FK, not null              | Cliente dueño            |
| `nombre`             | varchar(100) | not null                  | Nombre de la lista       |
| `es_por_defecto`     | boolean      | not null, default: false  | Si es la lista principal |
| `estado`             | enum         | not null, default: ACTIVA | ACTIVA, ARCHIVADA        |
| `fecha_creacion`     | timestamp    | not null, default: now()  |                          |
| `fecha_modificacion` | timestamp    | not null                  |                          |

**Constraints**:

- FK: `cliente_id` → `cliente(id)`

**Índices**:

```sql
CREATE INDEX idx_lista_deseos_cliente ON lista_deseos (cliente_id);
CREATE INDEX idx_lista_deseos_defecto ON lista_deseos (cliente_id, es_por_defecto);
```

**Enums**:

```sql
CREATE TYPE estado_lista_deseos AS ENUM ('ACTIVA', 'ARCHIVADA');
```

**Regla**: Exactamente UNA lista con `es_por_defecto = true` por cliente.

---

## 4. ItemListaDeseos

| Campo             | Tipo      | Restricciones            | Descripción              |
| ----------------- | --------- | ------------------------ | ------------------------ |
| `id`              | uuid      | PK                       | Identificador único      |
| `lista_deseos_id` | uuid      | FK, not null             | Lista a la que pertenece |
| `tipo_item`       | enum      | not null                 | PRODUCTO, PAQUETE        |
| `item_id`         | uuid      | not null                 | FK polimórfica           |
| `notas`           | text      | nullable                 | Notas personales         |
| `fecha_agregado`  | timestamp | not null, default: now() |                          |

**Constraints**:

- FK: `lista_deseos_id` → `lista_deseos(id)` ON DELETE CASCADE
- Unique: `(lista_deseos_id, tipo_item, item_id)`

**Índices**:

```sql
CREATE UNIQUE INDEX idx_item_lista_unique
ON item_lista_deseos (lista_deseos_id, tipo_item, item_id);

CREATE INDEX idx_item_lista_item
ON item_lista_deseos (tipo_item, item_id);
```

**Nota**: NO se guarda precio. Siempre se muestra el vigente del catálogo.

---

## 5. PreferenciaNotificacion

| Campo                | Tipo        | Restricciones           | Descripción                            |
| -------------------- | ----------- | ----------------------- | -------------------------------------- |
| `id`                 | uuid        | PK                      | Identificador único                    |
| `cliente_id`         | uuid        | FK, not null            | Cliente dueño                          |
| `tipo_notificacion`  | varchar(50) | not null                | Tipo específico                        |
| `categoria`          | enum        | not null                | TRANSACCIONAL, LISTA_DESEOS, OPERATIVA |
| `habilitada`         | boolean     | not null, default: true | Si está activa                         |
| `fecha_modificacion` | timestamp   | not null                | Última actualización                   |

**Constraints**:

- FK: `cliente_id` → `cliente(id)`
- Unique: `(cliente_id, tipo_notificacion)`

**Índices**:

```sql
CREATE UNIQUE INDEX idx_preferencia_cliente_tipo
ON preferencia_notificacion (cliente_id, tipo_notificacion);
```

**Enums**:

```sql
CREATE TYPE categoria_notificacion AS ENUM ('TRANSACCIONAL', 'LISTA_DESEOS', 'OPERATIVA');
```

**Regla**: Categoría TRANSACCIONAL NO puede deshabilitarse.

---

## Cliente (Modificado en v2.1)

**Ver**: `COMERCIAL_ENTITIES_CLAUDE.md`

**Cambio**: Nuevo campo `tipo_cliente` (CON_CUENTA, SIN_CUENTA)

---

**Referencia**: Ver `PRE_VENTA_CLAUDE.md` para lógica de negocio.
