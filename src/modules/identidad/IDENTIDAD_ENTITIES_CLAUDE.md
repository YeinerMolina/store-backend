# Entidades del Módulo IDENTIDAD

**Contexto**: IDENTIDAD  
**Archivo de Lógica**: `IDENTIDAD_CLAUDE.md`

---

## Entidades del Módulo

Este módulo contiene **4 entidades**:

1. Tercero (entidad base)
2. Empleado (rol especializado)
3. ProveedorBienes (rol especializado)
4. ProveedorServicios (rol especializado)

---

## 1. Tercero

**Descripción**: Entidad base que representa a cualquier persona natural o jurídica que interactúa con la tienda.

### Campos

| Campo                | Tipo         | Restricciones             | Descripción                            |
| -------------------- | ------------ | ------------------------- | -------------------------------------- |
| `id`                 | uuid         | PK, not null              | Identificador único                    |
| `tipo_persona`       | enum         | not null                  | NATURAL o JURIDICA                     |
| `tipo_documento`     | enum         | not null                  | CC, NIT, CE, PASAPORTE                 |
| `numero_documento`   | varchar(20)  | not null                  | Número de identificación               |
| `nombre_completo`    | varchar(200) | not null                  | Nombre completo o razón social         |
| `email`              | varchar(100) | nullable                  | Correo electrónico                     |
| `telefono`           | varchar(20)  | nullable                  | Teléfono de contacto                   |
| `direccion`          | varchar(300) | nullable                  | Dirección física                       |
| `ciudad`             | varchar(100) | nullable                  | Ciudad de residencia                   |
| `informacion_fiscal` | json         | nullable                  | Datos tributarios (RUT, régimen, etc.) |
| `estado`             | enum         | not null, default: ACTIVO | ACTIVO, INACTIVO                       |
| `fecha_creacion`     | timestamp    | not null, default: now()  | Fecha de creación                      |
| `fecha_modificacion` | timestamp    | not null                  | Fecha de última modificación           |

### Constraints

- **PK**: `id`
- **Unique**: `(tipo_documento, numero_documento)`
- **Unique parcial**: `email` (si no es null)

### Índices Requeridos

```sql
CREATE INDEX idx_tercero_documento ON tercero (tipo_documento, numero_documento);
CREATE UNIQUE INDEX idx_tercero_email ON tercero (email) WHERE email IS NOT NULL;
CREATE INDEX idx_tercero_estado ON tercero (estado);
```

### Enum: tipo_persona

```sql
CREATE TYPE tipo_persona AS ENUM ('NATURAL', 'JURIDICA');
```

### Enum: tipo_documento

```sql
CREATE TYPE tipo_documento AS ENUM ('CC', 'NIT', 'CE', 'PASAPORTE');
```

### Enum: estado_generico

```sql
CREATE TYPE estado_generico AS ENUM ('ACTIVO', 'INACTIVO');
```

### Ejemplo de informacion_fiscal (JSON)

```json
{
  "rut": "123456789-0",
  "regimen": "SIMPLIFICADO",
  "responsable_iva": false,
  "gran_contribuyente": false
}
```

### Reglas de Validación

- Si `tipo_persona = JURIDICA`, entonces `tipo_documento` debe ser `NIT`
- El par `(tipo_documento, numero_documento)` debe ser único globalmente
- `email` debe tener formato válido si se proporciona
- `fecha_modificacion` debe actualizarse en cada UPDATE

---

## 2. Empleado

**Descripción**: Rol especializado de Tercero que representa a un trabajador de la tienda con acceso al sistema.

### Campos

| Campo             | Tipo        | Restricciones             | Descripción                         |
| ----------------- | ----------- | ------------------------- | ----------------------------------- |
| `id`              | uuid        | PK, not null              | Identificador único del empleado    |
| `tercero_id`      | uuid        | FK, not null, unique      | Referencia a Tercero                |
| `codigo_empleado` | varchar(20) | not null, unique          | Código identificador del empleado   |
| `fecha_ingreso`   | date        | not null                  | Fecha de inicio de relación laboral |
| `fecha_egreso`    | date        | nullable                  | Fecha de finalización (si aplica)   |
| `estado`          | enum        | not null, default: ACTIVO | ACTIVO, INACTIVO, SUSPENDIDO        |
| `creado_por`      | uuid        | FK nullable               | Empleado que lo creó                |
| `fecha_creacion`  | timestamp   | not null, default: now()  | Fecha de creación del registro      |

### Constraints

- **PK**: `id`
- **FK**: `tercero_id` → `tercero(id)`
- **FK**: `creado_por` → `empleado(id)`
- **Unique**: `codigo_empleado`
- **Check**: `fecha_egreso IS NULL OR fecha_egreso >= fecha_ingreso`

### Índices Requeridos

```sql
CREATE UNIQUE INDEX idx_empleado_codigo ON empleado (codigo_empleado);
CREATE INDEX idx_empleado_tercero ON empleado (tercero_id);
CREATE INDEX idx_empleado_estado ON empleado (estado);
CREATE INDEX idx_empleado_creador ON empleado (creado_por);
```

### Enum: estado_empleado

```sql
CREATE TYPE estado_empleado AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');
```

### Reglas de Validación

- Un `tercero_id` puede tener múltiples registros de Empleado (histórico de reingresos)
- Solo puede haber UN empleado ACTIVO por tercero
- `codigo_empleado` debe ser único globalmente
- `creado_por` puede ser NULL solo para el primer empleado (bootstrap)
- `fecha_egreso` debe ser >= `fecha_ingreso` si se especifica

### Relaciones

- **Tercero**: Cada empleado está vinculado a UN tercero (1:1 activo, 1:N histórico)
- **Empleado creador**: Auto-referencia para trazabilidad

---

## 3. ProveedorBienes

**Descripción**: Rol especializado de Tercero que representa a un proveedor de productos para el catálogo.

### Campos

| Campo                   | Tipo         | Restricciones             | Descripción                             |
| ----------------------- | ------------ | ------------------------- | --------------------------------------- |
| `id`                    | uuid         | PK, not null              | Identificador único del proveedor       |
| `tercero_id`            | uuid         | FK, not null              | Referencia a Tercero                    |
| `codigo_proveedor`      | varchar(20)  | not null, unique          | Código identificador del proveedor      |
| `dias_pago`             | int          | nullable                  | Plazo de pago en días                   |
| `descuento_pronto_pago` | decimal(5,2) | nullable                  | Porcentaje de descuento por pronto pago |
| `notas_comerciales`     | text         | nullable                  | Observaciones comerciales               |
| `estado`                | enum         | not null, default: ACTIVO | ACTIVO, INACTIVO                        |
| `fecha_inicio_relacion` | date         | not null                  | Fecha de inicio de relación comercial   |
| `fecha_creacion`        | timestamp    | not null, default: now()  | Fecha de creación del registro          |

### Constraints

- **PK**: `id`
- **FK**: `tercero_id` → `tercero(id)`
- **Unique**: `codigo_proveedor`
- **Check**: `descuento_pronto_pago >= 0 AND descuento_pronto_pago <= 100` (si no es null)
- **Check**: `dias_pago >= 0` (si no es null)

### Índices Requeridos

```sql
CREATE UNIQUE INDEX idx_proveedor_bienes_codigo ON proveedor_bienes (codigo_proveedor);
CREATE INDEX idx_proveedor_bienes_tercero ON proveedor_bienes (tercero_id);
CREATE INDEX idx_proveedor_bienes_estado ON proveedor_bienes (estado);
```

### Reglas de Validación

- `codigo_proveedor` debe ser único globalmente
- `descuento_pronto_pago` debe estar en rango [0.00, 100.00] si se especifica
- `dias_pago` debe ser >= 0 si se especifica

### Relaciones

- **Tercero**: Cada proveedor está vinculado a UN tercero
- **Producto** (en CATALOGO): Un proveedor puede suministrar múltiples productos

---

## 4. ProveedorServicios

**Descripción**: Rol especializado de Tercero que representa a un proveedor de servicios externos (ej: envíos).

### Campos

| Campo                       | Tipo        | Restricciones             | Descripción                        |
| --------------------------- | ----------- | ------------------------- | ---------------------------------- |
| `id`                        | uuid        | PK, not null              | Identificador único del proveedor  |
| `tercero_id`                | uuid        | FK, not null              | Referencia a Tercero               |
| `codigo_proveedor`          | varchar(20) | not null, unique          | Código identificador del proveedor |
| `tipo_servicio`             | enum        | not null                  | ENVIO, OTRO                        |
| `configuracion_integracion` | json        | nullable                  | Configuración de API/integración   |
| `estado`                    | enum        | not null, default: ACTIVO | ACTIVO, INACTIVO                   |
| `fecha_creacion`            | timestamp   | not null, default: now()  | Fecha de creación del registro     |

### Constraints

- **PK**: `id`
- **FK**: `tercero_id` → `tercero(id)`
- **Unique**: `codigo_proveedor`

### Índices Requeridos

```sql
CREATE UNIQUE INDEX idx_proveedor_servicios_codigo ON proveedor_servicios (codigo_proveedor);
CREATE INDEX idx_proveedor_servicios_tercero ON proveedor_servicios (tercero_id);
CREATE INDEX idx_proveedor_servicios_tipo ON proveedor_servicios (tipo_servicio);
CREATE INDEX idx_proveedor_servicios_estado ON proveedor_servicios (estado);
```

### Enum: tipo_servicio

```sql
CREATE TYPE tipo_servicio AS ENUM ('ENVIO', 'OTRO');
```

### Ejemplo de configuracion_integracion (JSON)

Para tipo_servicio = ENVIO:

```json
{
  "api_url": "https://api.transportadora.com/v1",
  "api_key": "encrypted_key_here",
  "timeout_segundos": 30,
  "webhook_url": "https://mi-tienda.com/webhooks/envios"
}
```

### Reglas de Validación

- `codigo_proveedor` debe ser único globalmente
- Si `tipo_servicio = ENVIO`, `configuracion_integracion` debe contener `api_url` y `api_key`
- Las API keys en `configuracion_integracion` deben estar encriptadas en reposo

### Relaciones

- **Tercero**: Cada proveedor está vinculado a UN tercero
- **Envio** (en LOGISTICA): Un proveedor puede gestionar múltiples envíos

---

## Diagrama de Relaciones (Textual)

```
┌─────────────────┐
│    TERCERO      │
│   (Base)        │
└────────┬────────┘
         │
         │ 1
         │
    ┌────┴────┬───────────────┬──────────────────┐
    │         │               │                  │
    │ 0..*    │ 0..*          │ 0..*             │ 0..*
    ▼         ▼               ▼                  ▼
┌──────────┐ ┌──────────────┐ ┌────────────┐ (otros contextos)
│ EMPLEADO │ │PROVEEDOR     │ │PROVEEDOR   │
│          │ │BIENES        │ │SERVICIOS   │
└──────────┘ └──────────────┘ └────────────┘
```

**Nota**: Un Tercero puede tener múltiples roles simultáneamente.

---

## Scripts DDL Sugeridos

### Crear Enums

```sql
-- Enums compartidos
CREATE TYPE tipo_persona AS ENUM ('NATURAL', 'JURIDICA');
CREATE TYPE tipo_documento AS ENUM ('CC', 'NIT', 'CE', 'PASAPORTE');
CREATE TYPE estado_generico AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE estado_empleado AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');
CREATE TYPE tipo_servicio AS ENUM ('ENVIO', 'OTRO');
```

### Crear Tabla Tercero

```sql
CREATE TABLE tercero (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_persona tipo_persona NOT NULL,
    tipo_documento tipo_documento NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(300),
    ciudad VARCHAR(100),
    informacion_fiscal JSONB,
    estado estado_generico NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tercero_documento UNIQUE (tipo_documento, numero_documento)
);

CREATE UNIQUE INDEX idx_tercero_email ON tercero (email) WHERE email IS NOT NULL;
CREATE INDEX idx_tercero_estado ON tercero (estado);
```

### Crear Tabla Empleado

```sql
CREATE TABLE empleado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tercero_id UUID NOT NULL REFERENCES tercero(id),
    codigo_empleado VARCHAR(20) NOT NULL UNIQUE,
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    estado estado_empleado NOT NULL DEFAULT 'ACTIVO',
    creado_por UUID REFERENCES empleado(id),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_empleado_fechas CHECK (fecha_egreso IS NULL OR fecha_egreso >= fecha_ingreso)
);

CREATE UNIQUE INDEX idx_empleado_codigo ON empleado (codigo_empleado);
CREATE INDEX idx_empleado_tercero ON empleado (tercero_id);
CREATE INDEX idx_empleado_estado ON empleado (estado);
```

### Crear Tabla ProveedorBienes

```sql
CREATE TABLE proveedor_bienes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tercero_id UUID NOT NULL REFERENCES tercero(id),
    codigo_proveedor VARCHAR(20) NOT NULL UNIQUE,
    dias_pago INTEGER,
    descuento_pronto_pago DECIMAL(5,2),
    notas_comerciales TEXT,
    estado estado_generico NOT NULL DEFAULT 'ACTIVO',
    fecha_inicio_relacion DATE NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_proveedor_bienes_descuento CHECK (descuento_pronto_pago IS NULL OR (descuento_pronto_pago >= 0 AND descuento_pronto_pago <= 100)),
    CONSTRAINT chk_proveedor_bienes_dias CHECK (dias_pago IS NULL OR dias_pago >= 0)
);

CREATE UNIQUE INDEX idx_proveedor_bienes_codigo ON proveedor_bienes (codigo_proveedor);
CREATE INDEX idx_proveedor_bienes_tercero ON proveedor_bienes (tercero_id);
```

### Crear Tabla ProveedorServicios

```sql
CREATE TABLE proveedor_servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tercero_id UUID NOT NULL REFERENCES tercero(id),
    codigo_proveedor VARCHAR(20) NOT NULL UNIQUE,
    tipo_servicio tipo_servicio NOT NULL,
    configuracion_integracion JSONB,
    estado estado_generico NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_proveedor_servicios_codigo ON proveedor_servicios (codigo_proveedor);
CREATE INDEX idx_proveedor_servicios_tercero ON proveedor_servicios (tercero_id);
CREATE INDEX idx_proveedor_servicios_tipo ON proveedor_servicios (tipo_servicio);
```

---

## Migración de Datos (Consideraciones)

### Datos Iniciales Requeridos

1. **Primer Empleado (Bootstrap)**:

   ```sql
   -- Crear tercero administrador
   INSERT INTO tercero (tipo_persona, tipo_documento, numero_documento, nombre_completo, email, estado)
   VALUES ('NATURAL', 'CC', '0000000000', 'Administrador del Sistema', 'admin@tienda.com', 'ACTIVO');

   -- Crear empleado administrador (creado_por es NULL)
   INSERT INTO empleado (tercero_id, codigo_empleado, fecha_ingreso, estado, creado_por)
   VALUES ([id_tercero_creado], 'EMP001', '2026-01-01', 'ACTIVO', NULL);
   ```

### Validaciones Pre-Migración

- Verificar que no haya documentos duplicados
- Normalizar formato de emails
- Validar que todos los empleados tengan tercero asociado

---

## Referencias

- **Lógica de Negocio**: Ver `IDENTIDAD_CLAUDE.md`
- **Módulo SEGURIDAD**: Para perfiles y permisos de empleados
- **Módulo CATALOGO**: Para productos vinculados a proveedores
- **Módulo LOGISTICA**: Para envíos vinculados a proveedores de servicios

---

**Este archivo es autocontenido. Contiene toda la información de persistencia necesaria para implementar el módulo IDENTIDAD.**
