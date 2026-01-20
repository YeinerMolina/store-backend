# Entidades del Módulo LOGÍSTICA

**Contexto**: LOGISTICA  
**Archivo de Lógica**: `LOGISTICA_CLAUDE.md`

---

## Entidades

1. Envio

---

## 1. Envio

| Campo                     | Tipo          | Restricciones             | Descripción           |
| ------------------------- | ------------- | ------------------------- | --------------------- |
| `id`                      | uuid          | PK                        |                       |
| `venta_id`                | uuid          | FK, not null, unique      | Venta asociada        |
| `proveedor_servicios_id`  | uuid          | FK, not null              | Proveedor de envío    |
| `numero_guia`             | varchar(50)   | nullable                  | Número de tracking    |
| `estado`                  | enum          | not null, default: CREADO |                       |
| `direccion_destino`       | json          | not null                  | Snapshot de dirección |
| `costo_envio`             | decimal(12,2) | not null                  |                       |
| `url_seguimiento`         | varchar(500)  | nullable                  | URL de tracking       |
| `fecha_creacion`          | timestamp     | not null, default: now()  |                       |
| `fecha_despacho`          | timestamp     | nullable                  |                       |
| `fecha_entrega_proveedor` | timestamp     | nullable                  |                       |

**Constraints**:

- FK: `venta_id` → `venta(id)` UNIQUE
- FK: `proveedor_servicios_id` → `proveedor_servicios(id)`

**Enums**:

```sql
CREATE TYPE estado_envio AS ENUM ('CREADO', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO', 'CON_INCIDENCIA');
```

**Índices**:

```sql
CREATE INDEX idx_envio_numero_guia ON envio (numero_guia);
CREATE INDEX idx_envio_estado ON envio (estado);
```

---

**Referencia**: Ver `LOGISTICA_CLAUDE.md`
