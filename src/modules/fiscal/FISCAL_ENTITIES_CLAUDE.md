# Entidades del Módulo FISCAL

**Contexto**: FISCAL  
**Archivo de Lógica**: `FISCAL_CLAUDE.md`

---

## Entidades

1. DocumentoFiscal
2. NotaAjuste

---

## 1. DocumentoFiscal

| Campo                | Tipo          | Restricciones                | Descripción             |
| -------------------- | ------------- | ---------------------------- | ----------------------- |
| `id`                 | uuid          | PK                           |                         |
| `numero_documento`   | varchar(20)   | not null, unique             | Consecutivo legal       |
| `tipo`               | enum          | not null                     | FACTURA                 |
| `venta_id`           | uuid          | FK, not null, unique         |                         |
| `cliente_id`         | uuid          | FK, not null                 |                         |
| `subtotal`           | decimal(12,2) | not null                     |                         |
| `impuestos`          | json          | not null                     | Desglose de impuestos   |
| `total`              | decimal(12,2) | not null                     |                         |
| `contenido_completo` | json          | not null                     | Representación completa |
| `hash_integridad`    | varchar(64)   | not null                     | SHA-256 del contenido   |
| `estado_dian`        | enum          | not null, default: PENDIENTE |                         |
| `fecha_emision`      | timestamp     | not null, default: now()     |                         |

**Constraints**:

- FK: `venta_id` → `venta(id)` UNIQUE
- FK: `cliente_id` → `cliente(id)`

**Enums**:

```sql
CREATE TYPE tipo_doc_fiscal AS ENUM ('FACTURA');
CREATE TYPE estado_dian AS ENUM ('PENDIENTE', 'ENVIADO', 'ACEPTADO', 'RECHAZADO');
```

**IMPORTANTE**: Tabla INSERT-only (inmutable).

---

## 2. NotaAjuste

| Campo                 | Tipo          | Restricciones                | Descripción               |
| --------------------- | ------------- | ---------------------------- | ------------------------- |
| `id`                  | uuid          | PK                           |                           |
| `numero_documento`    | varchar(20)   | not null, unique             | Consecutivo legal         |
| `tipo`                | enum          | not null                     | NOTA_CREDITO, NOTA_DEBITO |
| `documento_fiscal_id` | uuid          | FK, not null                 | Factura original          |
| `cambio_id`           | uuid          | FK, not null                 | Cambio que origina        |
| `monto_ajuste`        | decimal(12,2) | not null                     |                           |
| `concepto`            | varchar(200)  | not null                     | Razón del ajuste          |
| `contenido_completo`  | json          | not null                     |                           |
| `hash_integridad`     | varchar(64)   | not null                     |                           |
| `estado_dian`         | enum          | not null, default: PENDIENTE |                           |
| `fecha_emision`       | timestamp     | not null, default: now()     |                           |

**Constraints**:

- FK: `documento_fiscal_id` → `documento_fiscal(id)`
- FK: `cambio_id` → `cambio(id)`

**Enums**:

```sql
CREATE TYPE tipo_nota_ajuste AS ENUM ('NOTA_CREDITO', 'NOTA_DEBITO');
```

**IMPORTANTE**: Tabla INSERT-only (inmutable).

---

**Referencia**: Ver `FISCAL_CLAUDE.md`
