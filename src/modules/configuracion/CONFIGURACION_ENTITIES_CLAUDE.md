# Entidades del Módulo CONFIGURACIÓN

**Contexto**: CONFIGURACION  
**Archivo de Lógica**: `CONFIGURACION_CLAUDE.md`

---

## Entidades

1. ParametroOperativo
2. Politica

---

## 1. ParametroOperativo

| Campo                | Tipo         | Restricciones            | Descripción                               |
| -------------------- | ------------ | ------------------------ | ----------------------------------------- |
| `id`                 | uuid         | PK                       |                                           |
| `clave`              | varchar(50)  | not null, unique         | Identificador del parámetro               |
| `nombre`             | varchar(100) | not null                 | Nombre descriptivo                        |
| `descripcion`        | text         | nullable                 | Documentación del parámetro               |
| `tipo_dato`          | enum         | not null                 | ENTERO, DECIMAL, BOOLEAN, TEXTO, DURACION |
| `valor`              | varchar(500) | not null                 | Valor actual                              |
| `valor_defecto`      | varchar(500) | not null                 | Valor por defecto                         |
| `valor_minimo`       | varchar(100) | nullable                 | Límite inferior                           |
| `valor_maximo`       | varchar(100) | nullable                 | Límite superior                           |
| `requiere_reinicio`  | boolean      | not null, default: false | Si requiere reiniciar app                 |
| `modificado_por`     | uuid         | FK nullable              | Empleado que modificó                     |
| `fecha_modificacion` | timestamp    | not null                 |                                           |

**Constraints**:

- Unique: `clave`
- FK: `modificado_por` → `empleado(id)`

**Enums**:

```sql
CREATE TYPE tipo_dato AS ENUM ('ENTERO', 'DECIMAL', 'BOOLEAN', 'TEXTO', 'DURACION');
```

---

## 2. Politica

| Campo                  | Tipo        | Restricciones               | Descripción                  |
| ---------------------- | ----------- | --------------------------- | ---------------------------- |
| `id`                   | uuid        | PK                          |                              |
| `tipo`                 | enum        | not null                    | CAMBIOS, ENVIOS, TERMINOS    |
| `version`              | varchar(10) | not null                    | Versión de la política       |
| `contenido`            | text        | not null                    | Texto completo               |
| `estado`               | enum        | not null, default: BORRADOR | BORRADOR, VIGENTE, ARCHIVADA |
| `fecha_vigencia_desde` | date        | nullable                    | Desde cuándo aplica          |
| `fecha_vigencia_hasta` | date        | nullable                    | Hasta cuándo aplica          |
| `publicado_por`        | uuid        | FK nullable                 | Empleado que publicó         |
| `fecha_creacion`       | timestamp   | not null, default: now()    |                              |

**Constraints**:

- Unique: `(tipo, version)`
- FK: `publicado_por` → `empleado(id)`

**Enums**:

```sql
CREATE TYPE tipo_politica AS ENUM ('CAMBIOS', 'ENVIOS', 'TERMINOS');
CREATE TYPE estado_politica AS ENUM ('BORRADOR', 'VIGENTE', 'ARCHIVADA');
```

**Índices**:

```sql
CREATE INDEX idx_politica_tipo_estado ON politica (tipo, estado);
```

---

**Referencia**: Ver `CONFIGURACION_CLAUDE.md`
