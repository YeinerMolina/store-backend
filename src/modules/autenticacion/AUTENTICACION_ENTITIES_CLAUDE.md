# Entidades del Módulo AUTENTICACION

**Contexto**: AUTENTICACION  
**Archivo de Lógica**: `AUTENTICACION_CLAUDE.md`

---

## Entidades

1. CuentaUsuario
2. SesionUsuario
3. TokenRecuperacion
4. LogAutenticacion

---

## 1. CuentaUsuario

**Propósito**: Almacenar credenciales de acceso para clientes y empleados.

| Campo                    | Tipo         | Restricciones                             | Descripción                                         |
| ------------------------ | ------------ | ----------------------------------------- | --------------------------------------------------- |
| `id`                     | uuid         | PK                                        | Identificador único (UUID v7)                       |
| `email`                  | varchar(100) | not null, unique                          | Email único (usado como username)                   |
| `password_hash`          | varchar(255) | not null                                  | Hash bcrypt de la contraseña (cost factor 12)       |
| `tipo_usuario`           | enum         | not null                                  | CLIENTE, EMPLEADO                                   |
| `cliente_id`             | uuid         | FK nullable                               | FK → Cliente (si tipo = CLIENTE)                    |
| `empleado_id`            | uuid         | FK nullable                               | FK → Empleado (si tipo = EMPLEADO)                  |
| `estado`                 | enum         | not null, default: PENDIENTE_VERIFICACION | ACTIVA, INACTIVA, BLOQUEADA, PENDIENTE_VERIFICACION |
| `email_verificado`       | boolean      | not null, default: false                  | Si el email fue verificado                          |
| `intentos_fallidos`      | int          | not null, default: 0                      | Contador de intentos fallidos consecutivos          |
| `bloqueado_hasta`        | timestamp    | nullable                                  | Si está bloqueada temporalmente                     |
| `ultimo_login`           | timestamp    | nullable                                  | Fecha del último login exitoso                      |
| `ultimo_cambio_password` | timestamp    | nullable                                  | Fecha del último cambio de contraseña               |
| `fecha_creacion`         | timestamp    | not null, default: now()                  | Fecha de creación de la cuenta                      |
| `fecha_modificacion`     | timestamp    | not null                                  | Última modificación                                 |

**Constraints**:

```sql
-- Email único global
CONSTRAINT uk_cuenta_usuario_email UNIQUE (email);

-- Solo uno de cliente_id o empleado_id debe estar poblado según tipo_usuario
CONSTRAINT ck_cuenta_usuario_tipo CHECK (
  (tipo_usuario = 'CLIENTE' AND cliente_id IS NOT NULL AND empleado_id IS NULL)
  OR
  (tipo_usuario = 'EMPLEADO' AND empleado_id IS NOT NULL AND cliente_id IS NULL)
);

-- cliente_id único (un cliente solo puede tener una cuenta)
CONSTRAINT uk_cuenta_usuario_cliente UNIQUE (cliente_id);

-- empleado_id único (un empleado solo puede tener una cuenta)
CONSTRAINT uk_cuenta_usuario_empleado UNIQUE (empleado_id);

-- Si está bloqueada, debe tener fecha de bloqueo
CONSTRAINT ck_cuenta_bloqueada CHECK (
  (estado = 'BLOQUEADA' AND bloqueado_hasta IS NOT NULL)
  OR
  (estado != 'BLOQUEADA')
);
```

**Foreign Keys**:

```sql
FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE;
FOREIGN KEY (empleado_id) REFERENCES empleado(id) ON DELETE CASCADE;
```

**Índices**:

```sql
CREATE UNIQUE INDEX idx_cuenta_usuario_email ON cuenta_usuario (email);
CREATE UNIQUE INDEX idx_cuenta_usuario_cliente ON cuenta_usuario (cliente_id) WHERE cliente_id IS NOT NULL;
CREATE UNIQUE INDEX idx_cuenta_usuario_empleado ON cuenta_usuario (empleado_id) WHERE empleado_id IS NOT NULL;
CREATE INDEX idx_cuenta_usuario_estado ON cuenta_usuario (estado);
```

**Nota sobre eliminación**:

- Si se elimina un Cliente, su cuenta también se elimina (CASCADE)
- Si se inactiva un Empleado, su cuenta debe inactivarse (lógica de aplicación)
- Para "eliminar" una cuenta sin borrarla físicamente, usar `estado = INACTIVA`

---

## 2. SesionUsuario

**Propósito**: Almacenar refresh tokens y sesiones activas.

| Campo                | Tipo         | Restricciones             | Descripción                                |
| -------------------- | ------------ | ------------------------- | ------------------------------------------ |
| `id`                 | uuid         | PK                        | Identificador único (UUID v7)              |
| `cuenta_usuario_id`  | uuid         | FK, not null              | FK → CuentaUsuario                         |
| `refresh_token_hash` | varchar(255) | not null, unique          | Hash SHA-256 del refresh token             |
| `dispositivo`        | varchar(200) | nullable                  | User-Agent o identificador del dispositivo |
| `ip_address`         | varchar(45)  | nullable                  | IP desde donde se creó (IPv6 compatible)   |
| `ubicacion`          | varchar(100) | nullable                  | Ubicación aproximada (país/ciudad)         |
| `estado`             | enum         | not null, default: ACTIVA | ACTIVA, REVOCADA, EXPIRADA                 |
| `fecha_creacion`     | timestamp    | not null, default: now()  | Momento de creación del token              |
| `fecha_expiracion`   | timestamp    | not null                  | Momento de expiración                      |
| `fecha_ultimo_uso`   | timestamp    | nullable                  | Último uso del refresh token               |
| `fecha_revocacion`   | timestamp    | nullable                  | Si fue revocada manualmente                |
| `revocada_por`       | uuid         | FK nullable               | FK → CuentaUsuario (si admin revocó)       |
| `motivo_revocacion`  | varchar(200) | nullable                  | Razón de revocación                        |

**Foreign Keys**:

```sql
FOREIGN KEY (cuenta_usuario_id) REFERENCES cuenta_usuario(id) ON DELETE CASCADE;
FOREIGN KEY (revocada_por) REFERENCES cuenta_usuario(id) ON DELETE SET NULL;
```

**Índices**:

```sql
CREATE INDEX idx_sesion_usuario_cuenta ON sesion_usuario (cuenta_usuario_id);
CREATE UNIQUE INDEX idx_sesion_usuario_refresh_hash ON sesion_usuario (refresh_token_hash);
CREATE INDEX idx_sesion_usuario_estado ON sesion_usuario (estado);
CREATE INDEX idx_sesion_usuario_expiracion ON sesion_usuario (estado, fecha_expiracion);
```

**Política de expiración** (según tipo de usuario):

- **Cliente**: 7 días (configurable vía `REFRESH_TOKEN_TTL_CLIENTE_DIAS`)
- **Empleado**: 8 horas (configurable vía `REFRESH_TOKEN_TTL_EMPLEADO_HORAS`)

**Nota de seguridad**:

- NUNCA almacenar el refresh token en texto plano
- Solo almacenar hash SHA-256: `createHash('sha256').update(token).digest('hex')`
- El refresh token opaco es un UUID v4 generado con `randomUUID()`

---

## 3. TokenRecuperacion

**Propósito**: Almacenar tokens de recuperación de contraseña y verificación de email.

| Campo               | Tipo         | Restricciones                | Descripción                               |
| ------------------- | ------------ | ---------------------------- | ----------------------------------------- |
| `id`                | uuid         | PK                           | Identificador único (UUID v7)             |
| `cuenta_usuario_id` | uuid         | FK, not null                 | FK → CuentaUsuario                        |
| `tipo_token`        | enum         | not null                     | RECUPERACION_PASSWORD, VERIFICACION_EMAIL |
| `token_hash`        | varchar(255) | not null, unique             | Hash SHA-256 del token enviado            |
| `estado`            | enum         | not null, default: PENDIENTE | PENDIENTE, USADO, EXPIRADO, INVALIDADO    |
| `fecha_creacion`    | timestamp    | not null, default: now()     | Momento de creación                       |
| `fecha_expiracion`  | timestamp    | not null                     | Momento de expiración                     |
| `fecha_uso`         | timestamp    | nullable                     | Cuando fue usado                          |
| `ip_solicitud`      | varchar(45)  | nullable                     | IP desde donde se solicitó                |
| `ip_uso`            | varchar(45)  | nullable                     | IP desde donde se usó                     |

**Foreign Keys**:

```sql
FOREIGN KEY (cuenta_usuario_id) REFERENCES cuenta_usuario(id) ON DELETE CASCADE;
```

**Índices**:

```sql
CREATE INDEX idx_token_recuperacion_cuenta ON token_recuperacion (cuenta_usuario_id);
CREATE UNIQUE INDEX idx_token_recuperacion_hash ON token_recuperacion (token_hash);
CREATE INDEX idx_token_recuperacion_tipo_estado ON token_recuperacion (tipo_token, estado);
```

**Política de expiración**:

- **RECUPERACION_PASSWORD**: 1 hora (configurable vía `MINUTOS_EXPIRACION_TOKEN_RECUPERACION`)
- **VERIFICACION_EMAIL**: 24 horas (configurable vía `HORAS_EXPIRACION_TOKEN_VERIFICACION`)

**Nota de seguridad**:

- Token generado: UUID v4 con `randomUUID()`
- Solo almacenar hash SHA-256 del token
- El token en texto plano se envía UNA SOLA VEZ por email, nunca se almacena

---

## 4. LogAutenticacion

**Propósito**: Auditoría inmutable de intentos de autenticación.

| Campo               | Tipo         | Restricciones            | Descripción                                   |
| ------------------- | ------------ | ------------------------ | --------------------------------------------- |
| `id`                | uuid         | PK                       | Identificador único (UUID v7)                 |
| `email_intento`     | varchar(100) | not null                 | Email usado en el intento                     |
| `cuenta_usuario_id` | uuid         | FK nullable              | FK → CuentaUsuario (si existe)                |
| `tipo_evento`       | enum         | not null                 | Ver tipos abajo                               |
| `resultado`         | enum         | not null                 | EXITOSO, FALLIDO                              |
| `motivo_fallo`      | varchar(100) | nullable                 | Razón del fallo (ej: "Password incorrecto")   |
| `ip_address`        | varchar(45)  | not null                 | IP del intento                                |
| `user_agent`        | varchar(500) | nullable                 | User-Agent del navegador                      |
| `ubicacion`         | varchar(100) | nullable                 | Ubicación aproximada                          |
| `metadata`          | jsonb        | nullable                 | Datos adicionales (ej: dispositivo, admin_id) |
| `fecha_evento`      | timestamp    | not null, default: now() | Momento del evento                            |

**Foreign Keys**:

```sql
FOREIGN KEY (cuenta_usuario_id) REFERENCES cuenta_usuario(id) ON DELETE SET NULL;
```

**Índices**:

```sql
CREATE INDEX idx_log_auth_email_fecha ON log_autenticacion (email_intento, fecha_evento);
CREATE INDEX idx_log_auth_cuenta_fecha ON log_autenticacion (cuenta_usuario_id, fecha_evento) WHERE cuenta_usuario_id IS NOT NULL;
CREATE INDEX idx_log_auth_tipo_fecha ON log_autenticacion (tipo_evento, fecha_evento);
CREATE INDEX idx_log_auth_ip_fecha ON log_autenticacion (ip_address, fecha_evento);
```

**Restricción**: Tabla **INSERT-only**. No permite UPDATE ni DELETE (auditoría inmutable).

**Tipos de evento** (enum `tipo_evento_auth`):

- `LOGIN`
- `LOGOUT`
- `REFRESH_TOKEN`
- `CAMBIO_PASSWORD`
- `RECUPERACION_PASSWORD_SOLICITUD`
- `RECUPERACION_PASSWORD_USO`
- `VERIFICACION_EMAIL`
- `BLOQUEO_CUENTA`
- `DESBLOQUEO_CUENTA`
- `REVOCACION_SESION`
- `REVOCACION_MASIVA`
- `CREACION_CUENTA_EMPLEADO`

**Resultado** (enum `resultado_auth`):

- `EXITOSO`
- `FALLIDO`

**Uso de metadata** (JSON):

```json
{
  "admin_id": "uuid",
  "sesiones_revocadas": 3,
  "bloqueado_hasta": "2026-01-10T15:30:00Z",
  "dispositivo": "iPhone 13 Pro",
  "app_version": "2.1.0"
}
```

**Recomendación de particionamiento**:

Para sistemas con alto volumen de logs, considerar particionar por fecha:

```sql
CREATE TABLE log_autenticacion (
  -- ... campos ...
) PARTITION BY RANGE (fecha_evento);

CREATE TABLE log_autenticacion_2026_01 PARTITION OF log_autenticacion
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## Enums

```sql
-- Tipo de usuario autenticable
CREATE TYPE tipo_usuario_auth AS ENUM ('CLIENTE', 'EMPLEADO');

-- Estado de la cuenta
CREATE TYPE estado_cuenta AS ENUM (
  'ACTIVA',                    -- Puede autenticarse
  'INACTIVA',                  -- Deshabilitada por admin
  'BLOQUEADA',                 -- Bloqueada por intentos fallidos
  'PENDIENTE_VERIFICACION'     -- Email no verificado (solo clientes)
);

-- Estado de sesión
CREATE TYPE estado_sesion AS ENUM (
  'ACTIVA',
  'REVOCADA',
  'EXPIRADA'
);

-- Tipo de token de recuperación
CREATE TYPE tipo_token_recuperacion AS ENUM (
  'RECUPERACION_PASSWORD',
  'VERIFICACION_EMAIL'
);

-- Estado del token
CREATE TYPE estado_token AS ENUM (
  'PENDIENTE',
  'USADO',
  'EXPIRADO',
  'INVALIDADO'
);

-- Tipo de evento de autenticación
CREATE TYPE tipo_evento_auth AS ENUM (
  'LOGIN',
  'LOGOUT',
  'REFRESH_TOKEN',
  'CAMBIO_PASSWORD',
  'RECUPERACION_PASSWORD_SOLICITUD',
  'RECUPERACION_PASSWORD_USO',
  'VERIFICACION_EMAIL',
  'BLOQUEO_CUENTA',
  'DESBLOQUEO_CUENTA',
  'REVOCACION_SESION',
  'REVOCACION_MASIVA',
  'CREACION_CUENTA_EMPLEADO'
);

-- Resultado del evento
CREATE TYPE resultado_auth AS ENUM ('EXITOSO', 'FALLIDO');
```

---

## Relaciones

### CuentaUsuario → Cliente

- **Cardinalidad**: 0..1 : 1 (Un cliente CON_CUENTA tiene exactamente una cuenta)
- **Dependencia**: Cliente puede existir sin cuenta (SIN_CUENTA), cuenta requiere cliente
- **Eliminación**: Si se elimina cliente, se elimina la cuenta (CASCADE)

### CuentaUsuario → Empleado

- **Cardinalidad**: 0..1 : 1 (Un empleado activo tiene exactamente una cuenta)
- **Dependencia**: Empleado puede existir sin cuenta (legacy), cuenta requiere empleado
- **Eliminación**: Si se inactiva empleado, se inactiva la cuenta (lógica de aplicación)

### CuentaUsuario → SesionUsuario

- **Cardinalidad**: 1 : 0..\* (Una cuenta puede tener múltiples sesiones)
- **Dependencia**: Sesión no existe sin cuenta
- **Eliminación**: Cascada (eliminar cuenta elimina sesiones)

### CuentaUsuario → TokenRecuperacion

- **Cardinalidad**: 1 : 0..\* (Una cuenta puede tener múltiples tokens históricos)
- **Dependencia**: Token no existe sin cuenta
- **Eliminación**: Cascada

### CuentaUsuario → LogAutenticacion

- **Cardinalidad**: 1 : 0..\* (Una cuenta puede tener múltiples logs)
- **Dependencia**: Log puede existir sin cuenta (intentos con email inexistente)
- **Eliminación**: SET NULL (preservar log aunque se elimine cuenta)

### SesionUsuario → CuentaUsuario (revocada_por)

- **Cardinalidad**: 0..1 : 0..\* (Un admin puede revocar múltiples sesiones)
- **Eliminación**: SET NULL (preservar información histórica)

---

## Diagrama DBML

```dbml
// ============================================
// CONTEXTO: AUTENTICACIÓN
// ============================================

Table cuenta_usuario {
  id uuid [pk, note: 'UUID v7']
  email varchar(100) [not null, unique]
  password_hash varchar(255) [not null, note: 'bcrypt cost factor 12']
  tipo_usuario tipo_usuario_auth [not null]
  cliente_id uuid [ref: > cliente.id, note: 'Solo si tipo = CLIENTE']
  empleado_id uuid [ref: > empleado.id, note: 'Solo si tipo = EMPLEADO']
  estado estado_cuenta [not null, default: 'PENDIENTE_VERIFICACION']
  email_verificado boolean [not null, default: false]
  intentos_fallidos int [not null, default: 0]
  bloqueado_hasta timestamp
  ultimo_login timestamp
  ultimo_cambio_password timestamp
  fecha_creacion timestamp [not null, default: `now()`]
  fecha_modificacion timestamp [not null]

  indexes {
    email [unique, name: 'idx_cuenta_usuario_email']
    cliente_id [unique, name: 'idx_cuenta_usuario_cliente']
    empleado_id [unique, name: 'idx_cuenta_usuario_empleado']
    estado [name: 'idx_cuenta_usuario_estado']
  }

  note: 'Credenciales unificadas para clientes y empleados'
}

Table sesion_usuario {
  id uuid [pk, note: 'UUID v7']
  cuenta_usuario_id uuid [not null, ref: > cuenta_usuario.id]
  refresh_token_hash varchar(255) [not null, unique, note: 'SHA-256 del refresh token opaco']
  dispositivo varchar(200)
  ip_address varchar(45)
  ubicacion varchar(100)
  estado estado_sesion [not null, default: 'ACTIVA']
  fecha_creacion timestamp [not null, default: `now()`]
  fecha_expiracion timestamp [not null]
  fecha_ultimo_uso timestamp
  fecha_revocacion timestamp
  revocada_por uuid [ref: > cuenta_usuario.id]
  motivo_revocacion varchar(200)

  indexes {
    cuenta_usuario_id [name: 'idx_sesion_usuario_cuenta']
    refresh_token_hash [unique, name: 'idx_sesion_usuario_refresh_hash']
    estado [name: 'idx_sesion_usuario_estado']
    (estado, fecha_expiracion) [name: 'idx_sesion_usuario_expiracion']
  }

  note: 'Refresh tokens y sesiones activas'
}

Table token_recuperacion {
  id uuid [pk, note: 'UUID v7']
  cuenta_usuario_id uuid [not null, ref: > cuenta_usuario.id]
  tipo_token tipo_token_recuperacion [not null]
  token_hash varchar(255) [not null, unique, note: 'SHA-256 del token']
  estado estado_token [not null, default: 'PENDIENTE']
  fecha_creacion timestamp [not null, default: `now()`]
  fecha_expiracion timestamp [not null]
  fecha_uso timestamp
  ip_solicitud varchar(45)
  ip_uso varchar(45)

  indexes {
    cuenta_usuario_id [name: 'idx_token_recuperacion_cuenta']
    token_hash [unique, name: 'idx_token_recuperacion_hash']
    (tipo_token, estado) [name: 'idx_token_recuperacion_tipo_estado']
  }

  note: 'Tokens de recuperación de password y verificación de email'
}

Table log_autenticacion {
  id uuid [pk, note: 'UUID v7']
  email_intento varchar(100) [not null]
  cuenta_usuario_id uuid [ref: > cuenta_usuario.id]
  tipo_evento tipo_evento_auth [not null]
  resultado resultado_auth [not null]
  motivo_fallo varchar(100)
  ip_address varchar(45) [not null]
  user_agent varchar(500)
  ubicacion varchar(100)
  metadata jsonb
  fecha_evento timestamp [not null, default: `now()`]

  indexes {
    (email_intento, fecha_evento) [name: 'idx_log_auth_email_fecha']
    (cuenta_usuario_id, fecha_evento) [name: 'idx_log_auth_cuenta_fecha']
    (tipo_evento, fecha_evento) [name: 'idx_log_auth_tipo_fecha']
    (ip_address, fecha_evento) [name: 'idx_log_auth_ip_fecha']
  }

  note: 'INSERT-only. Auditoría inmutable de autenticación.'
}

// Enums
Enum tipo_usuario_auth {
  CLIENTE
  EMPLEADO
}

Enum estado_cuenta {
  ACTIVA
  INACTIVA
  BLOQUEADA
  PENDIENTE_VERIFICACION
}

Enum estado_sesion {
  ACTIVA
  REVOCADA
  EXPIRADA
}

Enum tipo_token_recuperacion {
  RECUPERACION_PASSWORD
  VERIFICACION_EMAIL
}

Enum estado_token {
  PENDIENTE
  USADO
  EXPIRADO
  INVALIDADO
}

Enum tipo_evento_auth {
  LOGIN
  LOGOUT
  REFRESH_TOKEN
  CAMBIO_PASSWORD
  RECUPERACION_PASSWORD_SOLICITUD
  RECUPERACION_PASSWORD_USO
  VERIFICACION_EMAIL
  BLOQUEO_CUENTA
  DESBLOQUEO_CUENTA
  REVOCACION_SESION
  REVOCACION_MASIVA
  CREACION_CUENTA_EMPLEADO
}

Enum resultado_auth {
  EXITOSO
  FALLIDO
}
```

---

## Modificación a Entidad Existente: Cliente

Para facilitar consultas rápidas, agregar campo denormalizado:

```sql
ALTER TABLE cliente
ADD COLUMN tiene_cuenta boolean NOT NULL DEFAULT false;

-- Índice para filtrar clientes CON_CUENTA vs SIN_CUENTA
CREATE INDEX idx_cliente_tiene_cuenta ON cliente (tiene_cuenta);
```

**Nota**: Este campo es redundante pero evita JOINs frecuentes. Debe mantenerse sincronizado vía:

- Lógica de aplicación (actualizar al crear/eliminar cuenta)
- O Trigger en base de datos

**Ejemplo de trigger**:

```sql
CREATE OR REPLACE FUNCTION actualizar_cliente_tiene_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo_usuario = 'CLIENTE' THEN
    UPDATE cliente SET tiene_cuenta = true WHERE id = NEW.cliente_id;
  ELSIF TG_OP = 'DELETE' AND OLD.tipo_usuario = 'CLIENTE' THEN
    UPDATE cliente SET tiene_cuenta = false WHERE id = OLD.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_cliente_tiene_cuenta
AFTER INSERT OR DELETE ON cuenta_usuario
FOR EACH ROW
EXECUTE FUNCTION actualizar_cliente_tiene_cuenta();
```

---

## Consideraciones de Rendimiento

### Índices Críticos

Los índices definidos en cada entidad están optimizados para:

- **Login**: Búsqueda por email (idx_cuenta_usuario_email)
- **Validación de sesiones**: Hash de refresh token (idx_sesion_usuario_refresh_hash)
- **Verificación de tokens**: Hash de token de recuperación (idx_token_recuperacion_hash)
- **Auditoría**: Consultas por email, cuenta, IP y tipo de evento en log

### Particionamiento

Para sistemas de alta carga, considerar:

- **log_autenticacion**: Particionar por rango de fecha (mensual)
- **sesion_usuario**: Archivar sesiones expiradas > 30 días

### Limpieza Periódica

Jobs background para:

- Eliminar sesiones expiradas > 90 días
- Archivar logs > 1 año (según política de retención)
- Eliminar tokens de recuperación > 7 días en estado EXPIRADO/USADO

---

## Seguridad de Datos

### Datos Sensibles

- `password_hash`: NUNCA exponer en APIs
- `refresh_token_hash`: NUNCA exponer
- `token_hash`: NUNCA exponer

### Protección

- Usar bcrypt para passwords (irreversible)
- Usar SHA-256 para tokens (one-way hash)
- Nunca loggear contraseñas o tokens en texto plano
- Encriptar comunicaciones (HTTPS obligatorio)

### Cumplimiento

- **GDPR/CCPA**: `email`, `ip_address`, `ubicacion` son datos personales
- Permitir exportación de datos del usuario
- Implementar eliminación completa (derecho al olvido)

---

## Resumen de Entidades

| #   | Entidad           | Propósito                     | Relación Principal         | Inmutable |
| --- | ----------------- | ----------------------------- | -------------------------- | --------- |
| 33  | CuentaUsuario     | Credenciales de acceso        | → Cliente o → Empleado     | No        |
| 34  | SesionUsuario     | Refresh tokens activos        | → CuentaUsuario            | No        |
| 35  | TokenRecuperacion | Reset password y verificación | → CuentaUsuario            | No        |
| 36  | LogAutenticacion  | Auditoría de autenticación    | → CuentaUsuario (opcional) | **Sí**    |

**Total de entidades del sistema**: 36 (32 existentes del dominio v2.1 + 4 nuevas de autenticación)

---

**Referencia**: Ver `AUTENTICACION_CLAUDE.md` para lógica de negocio y casos de uso.
