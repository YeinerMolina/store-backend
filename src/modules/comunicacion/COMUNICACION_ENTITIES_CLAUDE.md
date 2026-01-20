# Entidades del Módulo COMUNICACIÓN

**Contexto**: COMUNICACION  
**Archivo de Lógica**: `COMUNICACION_CLAUDE.md`

**NUEVO en v2.1**

---

## Entidades

1. Notificacion

---

## 1. Notificacion

| Campo                      | Tipo         | Restricciones                | Descripción                            |
| -------------------------- | ------------ | ---------------------------- | -------------------------------------- |
| `id`                       | uuid         | PK                           |                                        |
| `destinatario_tipo`        | enum         | not null                     | CLIENTE, EMPLEADO                      |
| `destinatario_id`          | uuid         | not null                     | FK polimórfica                         |
| `tipo_notificacion`        | varchar(50)  | not null                     | Tipo específico                        |
| `categoria`                | enum         | not null                     | TRANSACCIONAL, LISTA_DESEOS, OPERATIVA |
| `titulo`                   | varchar(200) | not null                     |                                        |
| `contenido`                | text         | not null                     |                                        |
| `estado`                   | enum         | not null, default: PENDIENTE | PENDIENTE, ENVIADA, FALLIDA            |
| `canal`                    | enum         | not null, default: IN_APP    | IN_APP                                 |
| `evento_origen_tipo`       | varchar(50)  | not null                     | Tipo de evento                         |
| `evento_origen_id`         | uuid         | nullable                     | ID del evento                          |
| `entidad_relacionada_tipo` | varchar(50)  | nullable                     | Ej: "Venta"                            |
| `entidad_relacionada_id`   | uuid         | nullable                     | ID de venta, etc.                      |
| `intentos_envio`           | int          | not null, default: 0         |                                        |
| `fecha_creacion`           | timestamp    | not null, default: now()     |                                        |
| `fecha_envio`              | timestamp    | nullable                     |                                        |
| `fecha_proximo_reintento`  | timestamp    | nullable                     |                                        |
| `fecha_descarte`           | timestamp    | nullable                     | Cuándo el usuario la descartó          |

**Enums**:

```sql
CREATE TYPE tipo_destinatario AS ENUM ('CLIENTE', 'EMPLEADO');
CREATE TYPE categoria_notificacion AS ENUM ('TRANSACCIONAL', 'LISTA_DESEOS', 'OPERATIVA');
CREATE TYPE estado_notificacion AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');
CREATE TYPE canal_notificacion AS ENUM ('IN_APP');
```

**Índices**:

```sql
CREATE INDEX idx_notificacion_destinatario
ON notificacion (destinatario_tipo, destinatario_id, estado);

CREATE INDEX idx_notificacion_tipo
ON notificacion (tipo_notificacion);

CREATE INDEX idx_notificacion_fecha
ON notificacion (fecha_creacion);

CREATE INDEX idx_notificacion_reintento
ON notificacion (estado, fecha_proximo_reintento);
```

---

**Referencia**: Ver `COMUNICACION_CLAUDE.md`
