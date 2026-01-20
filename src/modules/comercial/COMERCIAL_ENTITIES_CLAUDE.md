# Entidades del Módulo COMERCIAL

**Contexto**: COMERCIAL  
**Archivo de Lógica**: `COMERCIAL_CLAUDE.md`

---

## Entidades

1. Cliente
2. DireccionCliente
3. Venta
4. LineaVenta
5. Cambio

---

## 1. Cliente

| Campo                   | Tipo         | Restricciones             | Descripción                            |
| ----------------------- | ------------ | ------------------------- | -------------------------------------- |
| `id`                    | uuid         | PK                        |                                        |
| `tipo_cliente`          | enum         | not null                  | **NUEVO v2.1**: CON_CUENTA, SIN_CUENTA |
| `tipo_documento`        | enum         | not null                  | CC, NIT, CE, PASAPORTE                 |
| `numero_documento`      | varchar(20)  | not null                  |                                        |
| `nombre_completo`       | varchar(200) | not null                  |                                        |
| `email`                 | varchar(100) | nullable                  | **Obligatorio si CON_CUENTA**          |
| `telefono`              | varchar(20)  | nullable                  |                                        |
| `acepta_comunicaciones` | boolean      | not null, default: false  |                                        |
| `estado`                | enum         | not null, default: ACTIVO |                                        |
| `fecha_registro`        | timestamp    | not null, default: now()  |                                        |
| `fecha_modificacion`    | timestamp    | not null                  |                                        |

**Constraints**:

- Unique: `(tipo_documento, numero_documento)`
- Unique: `email` (si no null)
- Check: Si `tipo_cliente = CON_CUENTA` entonces `email IS NOT NULL`

**Enums**:

```sql
CREATE TYPE tipo_cliente AS ENUM ('CON_CUENTA', 'SIN_CUENTA');
```

---

## 2. DireccionCliente

| Campo            | Tipo         | Restricciones             | Descripción       |
| ---------------- | ------------ | ------------------------- | ----------------- |
| `id`             | uuid         | PK                        |                   |
| `cliente_id`     | uuid         | FK, not null              |                   |
| `alias`          | varchar(50)  | nullable                  | "Casa", "Oficina" |
| `direccion`      | varchar(300) | not null                  |                   |
| `ciudad`         | varchar(100) | not null                  |                   |
| `departamento`   | varchar(100) | not null                  |                   |
| `codigo_postal`  | varchar(10)  | nullable                  |                   |
| `instrucciones`  | text         | nullable                  |                   |
| `es_principal`   | boolean      | not null, default: false  |                   |
| `estado`         | enum         | not null, default: ACTIVO |                   |
| `fecha_creacion` | timestamp    | not null, default: now()  |                   |

**Constraints**:

- FK: `cliente_id` → `cliente(id)`

---

## 3. Venta

| Campo                        | Tipo          | Restricciones               | Descripción                      |
| ---------------------------- | ------------- | --------------------------- | -------------------------------- |
| `id`                         | uuid          | PK                          |                                  |
| `numero_pedido`              | varchar(20)   | not null, unique            | Número de orden                  |
| `cliente_id`                 | uuid          | FK, not null                |                                  |
| `carrito_origen_id`          | uuid          | FK nullable                 | **NUEVO v2.1**: Trazabilidad     |
| `canal`                      | enum          | not null                    | FISICO, DIGITAL                  |
| `estado`                     | enum          | not null, default: BORRADOR |                                  |
| `modalidad_entrega`          | enum          | not null                    | RECOGIDA_TIENDA, ENTREGA_EXTERNA |
| `direccion_entrega_id`       | uuid          | FK nullable                 |                                  |
| `direccion_entrega_snapshot` | json          | nullable                    | Snapshot de dirección            |
| `subtotal`                   | decimal(12,2) | not null                    |                                  |
| `descuento_total`            | decimal(12,2) | not null, default: 0        |                                  |
| `costo_envio`                | decimal(12,2) | not null, default: 0        |                                  |
| `total`                      | decimal(12,2) | not null                    |                                  |
| `empleado_id`                | uuid          | FK nullable                 | Si venta física                  |
| `fecha_creacion`             | timestamp     | not null, default: now()    |                                  |
| `fecha_confirmacion`         | timestamp     | nullable                    |                                  |
| `fecha_entrega_efectiva`     | timestamp     | nullable                    |                                  |

**Constraints**:

- FK: `cliente_id` → `cliente(id)`
- FK: `carrito_origen_id` → `carrito(id)`
- FK: `empleado_id` → `empleado(id)`

**Enums**:

```sql
CREATE TYPE canal_venta AS ENUM ('FISICO', 'DIGITAL');
CREATE TYPE modalidad_entrega AS ENUM ('RECOGIDA_TIENDA', 'ENTREGA_EXTERNA');
CREATE TYPE estado_venta AS ENUM ('BORRADOR', 'CONFIRMADA', 'ENVIADA', 'ENTREGADA', 'CON_INCIDENCIA', 'CANCELADA');
```

---

## 4. LineaVenta

| Campo                 | Tipo          | Restricciones            | Descripción            |
| --------------------- | ------------- | ------------------------ | ---------------------- |
| `id`                  | uuid          | PK                       |                        |
| `venta_id`            | uuid          | FK, not null             |                        |
| `tipo_item`           | enum          | not null                 | PRODUCTO, PAQUETE      |
| `item_id`             | uuid          | not null                 | FK polimórfica         |
| `cantidad`            | int           | not null                 |                        |
| `precio_unitario`     | decimal(12,2) | not null                 | **Precio contractual** |
| `descuento_linea`     | decimal(12,2) | not null, default: 0     |                        |
| `subtotal`            | decimal(12,2) | not null                 |                        |
| `es_resultado_cambio` | boolean       | not null, default: false |                        |
| `cambio_origen_id`    | uuid          | nullable                 |                        |
| `puede_ser_cambiada`  | boolean       | not null, default: true  |                        |
| `fecha_creacion`      | timestamp     | not null, default: now() |                        |

**Constraints**:

- FK: `venta_id` → `venta(id)`
- Check: `cantidad > 0`
- Check: `precio_unitario > 0`

---

## 5. Cambio

| Campo                    | Tipo          | Restricciones                 | Descripción    |
| ------------------------ | ------------- | ----------------------------- | -------------- |
| `id`                     | uuid          | PK                            |                |
| `numero_cambio`          | varchar(20)   | not null, unique              |                |
| `venta_id`               | uuid          | FK, not null                  |                |
| `linea_venta_id`         | uuid          | FK, not null                  | Línea original |
| `tipo_item_nuevo`        | enum          | not null                      |                |
| `item_nuevo_id`          | uuid          | not null                      |                |
| `estado`                 | enum          | not null, default: SOLICITADO |                |
| `precio_item_original`   | decimal(12,2) | not null                      |                |
| `precio_item_nuevo`      | decimal(12,2) | nullable                      |                |
| `diferencia_precio`      | decimal(12,2) | nullable                      |                |
| `estado_pago_diferencia` | enum          | not null, default: NO_APLICA  |                |
| `reserva_id`             | uuid          | FK nullable                   |                |
| `empleado_aprobador_id`  | uuid          | FK nullable                   |                |
| `motivo_rechazo`         | text          | nullable                      |                |
| `notas_validacion`       | text          | nullable                      |                |
| `fecha_solicitud`        | timestamp     | not null, default: now()      |                |
| `fecha_recepcion`        | timestamp     | nullable                      |                |
| `fecha_aprobacion`       | timestamp     | nullable                      |                |
| `fecha_ejecucion`        | timestamp     | nullable                      |                |
| `fecha_rechazo`          | timestamp     | nullable                      |                |

**Constraints**:

- FK: `venta_id` → `venta(id)`
- FK: `linea_venta_id` → `linea_venta(id)`
- FK: `reserva_id` → `reserva(id)`
- FK: `empleado_aprobador_id` → `empleado(id)`

**Enums**:

```sql
CREATE TYPE estado_cambio AS ENUM ('SOLICITADO', 'RECIBIDO', 'APROBADO', 'EJECUTADO', 'RECHAZADO');
CREATE TYPE estado_pago_diferencia AS ENUM ('NO_APLICA', 'PENDIENTE', 'PAGADO', 'EXPIRADO');
```

---

**Referencia**: Ver `COMERCIAL_CLAUDE.md`
