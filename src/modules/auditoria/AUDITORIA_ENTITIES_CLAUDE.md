# Entidades del Módulo AUDITORÍA

**Contexto**: AUDITORIA  
**Archivo de Lógica**: `AUDITORIA_CLAUDE.md`

---

## Entidades

1. EventoDominio

---

## 1. EventoDominio

| Campo            | Tipo        | Restricciones            | Descripción                       |
| ---------------- | ----------- | ------------------------ | --------------------------------- |
| `id`             | uuid        | PK                       | Identificador único               |
| `tipo_evento`    | varchar(50) | not null                 | Nombre del evento                 |
| `agregado_tipo`  | varchar(50) | not null                 | Tipo de entidad                   |
| `agregado_id`    | uuid        | not null                 | ID de la entidad                  |
| `actor_tipo`     | enum        | not null                 | EMPLEADO, CLIENTE, SISTEMA        |
| `actor_id`       | uuid        | nullable                 | ID del actor (null si SISTEMA)    |
| `payload`        | json        | not null                 | Datos del evento                  |
| `correlacion_id` | uuid        | nullable                 | Para agrupar eventos relacionados |
| `fecha_evento`   | timestamp   | not null, default: now() | Cuándo ocurrió                    |

**Enums**:

```sql
CREATE TYPE tipo_actor AS ENUM ('EMPLEADO', 'CLIENTE', 'SISTEMA');
```

**Constraints**:

- Ningún constraint de FK (desacoplado para inmutabilidad)

**Índices**:

```sql
CREATE INDEX idx_evento_tipo ON evento_dominio (tipo_evento);
CREATE INDEX idx_evento_agregado ON evento_dominio (agregado_tipo, agregado_id);
CREATE INDEX idx_evento_fecha ON evento_dominio (fecha_evento);
CREATE INDEX idx_evento_correlacion ON evento_dominio (correlacion_id);
```

**IMPORTANTE**: Tabla INSERT-only (inmutable).

---

## Ejemplo de Payload

### Evento: VentaConfirmada

```json
{
  "venta_id": "uuid-here",
  "numero_pedido": "PED-2026-001",
  "cliente_id": "uuid-here",
  "total": 150000.0,
  "canal": "DIGITAL",
  "fecha_confirmacion": "2026-01-20T10:30:00Z"
}
```

### Evento: ProductoDeListaDeseosDisponibleNuevamente

```json
{
  "producto_id": "uuid-here",
  "sku": "PROD-001",
  "nombre": "Camiseta Azul",
  "clientes_afectados": ["uuid1", "uuid2"],
  "cantidad_disponible": 50
}
```

---

## Consultas Comunes

### Historial de una Venta

```sql
SELECT * FROM evento_dominio
WHERE agregado_tipo = 'Venta' AND agregado_id = ?
ORDER BY fecha_evento ASC;
```

### Eventos de una Operación Completa

```sql
SELECT * FROM evento_dominio
WHERE correlacion_id = ?
ORDER BY fecha_evento ASC;
```

### Eventos de un Actor

```sql
SELECT * FROM evento_dominio
WHERE actor_tipo = 'EMPLEADO' AND actor_id = ?
ORDER BY fecha_evento DESC;
```

---

**Referencia**: Ver `AUDITORIA_CLAUDE.md`
