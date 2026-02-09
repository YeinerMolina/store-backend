# Diseño de Persistencia: Módulo de Autenticación
## Tienda Retail - Extensión al Backend v2

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Basado en**: Dominio v2.1 + Backend v2.0 + Arquitectura Tecnológica v1.0

---

## 1. Análisis de Requerimientos

### 1.1 Tipos de Usuarios Autenticables

| Tipo | Entidad Base | Se Autentica | Aplicación |
|------|--------------|--------------|------------|
| Cliente CON_CUENTA | Cliente | ✅ Sí | App Cliente (web/móvil) |
| Cliente SIN_CUENTA | Cliente | ❌ No | N/A (solo tienda física) |
| Empleado | Empleado → Tercero | ✅ Sí | App Empleado (interno) |

### 1.2 Requerimientos Funcionales

1. **Login unificado**: Un sistema de credenciales que soporte ambos tipos de usuario
2. **Tokens diferenciados**: TTL y claims diferentes según tipo de usuario
3. **Refresh tokens**: Renovación sin re-login
4. **Múltiples sesiones**: Un usuario puede tener sesiones en varios dispositivos
5. **Revocación**: Capacidad de invalidar sesiones específicas o todas
6. **Recuperación de contraseña**: Flujo de reset vía email
7. **Auditoría**: Registro de intentos de login (éxito/fallo)
8. **Bloqueo por intentos**: Protección contra fuerza bruta

### 1.3 Requerimientos No Funcionales

- Contraseñas hasheadas con bcrypt (cost factor 12)
- Tokens JWT firmados con RS256 (asimétrico)
- Refresh tokens opacos almacenados en BD
- Sin almacenamiento de contraseñas en texto plano
- Cumplimiento de buenas prácticas OWASP

---

## 2. Decisión Arquitectónica: ¿Una Tabla o Separadas?

### 2.1 Análisis de Opciones

| Opción | Ventajas | Desventajas |
|--------|----------|-------------|
| **Una tabla unificada** | Login único, código simplificado, email único global | Campos nullable según tipo, FK polimórfica |
| **Tablas separadas** | Modelo más puro, sin nullable | Lógica duplicada, posible colisión de emails |

### 2.2 Decisión: **Tabla Unificada con Discriminador**

**Justificación:**

1. **Email único global**: Un email no puede ser simultáneamente cliente y empleado (evita confusión y posibles brechas de seguridad)

2. **Código simplificado**: Un único servicio de autenticación, un único endpoint de login

3. **Experiencia de usuario**: El sistema determina automáticamente el tipo de usuario por el email

4. **Refresh tokens unificados**: Una sola tabla de sesiones para ambos tipos

5. **Auditoría centralizada**: Un solo lugar para ver todos los intentos de acceso

**Trade-off aceptado**: Campos `cliente_id` y `empleado_id` son mutuamente excluyentes (uno siempre null). Se implementa constraint CHECK para garantizar integridad.

---

## 3. Modelo de Datos

### 3.1 Nueva Entidad: CuentaUsuario

**Propósito**: Almacenar credenciales de acceso para clientes y empleados.

| Atributo | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| id | UUID | Sí | Identificador único |
| email | String(100) | Sí | Email único (usado como username) |
| password_hash | String(255) | Sí | Hash bcrypt de la contraseña |
| tipo_usuario | ENUM | Sí | CLIENTE, EMPLEADO |
| cliente_id | UUID | Condicional | FK → Cliente (si tipo = CLIENTE) |
| empleado_id | UUID | Condicional | FK → Empleado (si tipo = EMPLEADO) |
| estado | ENUM | Sí | ACTIVA, INACTIVA, BLOQUEADA, PENDIENTE_VERIFICACION |
| email_verificado | Boolean | Sí | Si el email fue verificado |
| intentos_fallidos | Integer | Sí | Contador de intentos fallidos consecutivos |
| bloqueado_hasta | Timestamp | No | Si está bloqueada temporalmente |
| ultimo_login | Timestamp | No | Fecha del último login exitoso |
| ultimo_cambio_password | Timestamp | No | Fecha del último cambio de contraseña |
| fecha_creacion | Timestamp | Sí | Fecha de creación |

**Dato derivado (no persistir)**:
- `requiere_cambio_password`: Se calcula como `ultimo_cambio_password IS NULL` (primer login) O `ultimo_cambio_password + DIAS_EXPIRACION_PASSWORD < ahora` (solo para empleados)
| fecha_modificacion | Timestamp | Sí | Última modificación |

**Constraints:**
- `email` UNIQUE
- CHECK: `(tipo_usuario = 'CLIENTE' AND cliente_id IS NOT NULL AND empleado_id IS NULL) OR (tipo_usuario = 'EMPLEADO' AND empleado_id IS NOT NULL AND cliente_id IS NULL)`

**Índices:**
- `email` (único)
- `cliente_id` (único, parcial donde no es null)
- `empleado_id` (único, parcial donde no es null)
- `estado`

---

### 3.2 Nueva Entidad: SesionUsuario

**Propósito**: Almacenar refresh tokens y sesiones activas.

| Atributo | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| id | UUID | Sí | Identificador único |
| cuenta_usuario_id | UUID | Sí | FK → CuentaUsuario |
| refresh_token_hash | String(255) | Sí | Hash del refresh token |
| dispositivo | String(200) | No | User-Agent o identificador del dispositivo |
| ip_address | String(45) | No | IP desde donde se creó (IPv6 compatible) |
| ubicacion | String(100) | No | Ubicación aproximada (país/ciudad) |
| estado | ENUM | Sí | ACTIVA, REVOCADA, EXPIRADA |
| fecha_creacion | Timestamp | Sí | Momento de creación del token |
| fecha_expiracion | Timestamp | Sí | Momento de expiración |
| fecha_ultimo_uso | Timestamp | No | Último uso del refresh token |
| fecha_revocacion | Timestamp | No | Si fue revocada manualmente |
| revocada_por | UUID | No | FK → CuentaUsuario (si admin revocó) |
| motivo_revocacion | String(200) | No | Razón de revocación |

**Índices:**
- `cuenta_usuario_id`
- `refresh_token_hash` (único)
- `estado, fecha_expiracion` (para limpieza)

**Política de expiración (del documento de arquitectura):**
- Cliente: Refresh token 7 días
- Empleado: Refresh token 8 horas (turno laboral)

---

### 3.3 Nueva Entidad: TokenRecuperacion

**Propósito**: Almacenar tokens de recuperación de contraseña y verificación de email.

| Atributo | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| id | UUID | Sí | Identificador único |
| cuenta_usuario_id | UUID | Sí | FK → CuentaUsuario |
| tipo_token | ENUM | Sí | RECUPERACION_PASSWORD, VERIFICACION_EMAIL |
| token_hash | String(255) | Sí | Hash del token enviado |
| estado | ENUM | Sí | PENDIENTE, USADO, EXPIRADO, INVALIDADO |
| fecha_creacion | Timestamp | Sí | Momento de creación |
| fecha_expiracion | Timestamp | Sí | Momento de expiración |
| fecha_uso | Timestamp | No | Cuando fue usado |
| ip_solicitud | String(45) | No | IP desde donde se solicitó |
| ip_uso | String(45) | No | IP desde donde se usó |

**Índices:**
- `cuenta_usuario_id`
- `token_hash` (único)
- `tipo_token, estado`

**Política de expiración:**
- Recuperación de contraseña: 1 hora
- Verificación de email: 24 horas

---

### 3.4 Nueva Entidad: LogAutenticacion

**Propósito**: Auditoría inmutable de intentos de autenticación.

| Atributo | Tipo | Obligatorio | Descripción |
|----------|------|-------------|-------------|
| id | UUID | Sí | Identificador único |
| email_intento | String(100) | Sí | Email usado en el intento |
| cuenta_usuario_id | UUID | No | FK → CuentaUsuario (si existe) |
| tipo_evento | ENUM | Sí | Ver tipos abajo |
| resultado | ENUM | Sí | EXITOSO, FALLIDO |
| motivo_fallo | String(100) | No | Razón del fallo |
| ip_address | String(45) | Sí | IP del intento |
| user_agent | String(500) | No | User-Agent del navegador |
| ubicacion | String(100) | No | Ubicación aproximada |
| metadata | JSON | No | Datos adicionales |
| fecha_evento | Timestamp | Sí | Momento del evento |

**Tipos de evento:**
- LOGIN
- LOGOUT
- REFRESH_TOKEN
- CAMBIO_PASSWORD
- RECUPERACION_PASSWORD_SOLICITUD
- RECUPERACION_PASSWORD_USO
- VERIFICACION_EMAIL
- BLOQUEO_CUENTA
- DESBLOQUEO_CUENTA

**Índices:**
- `email_intento, fecha_evento`
- `cuenta_usuario_id, fecha_evento`
- `tipo_evento, fecha_evento`
- `ip_address, fecha_evento`

**Restricción:** Tabla INSERT-only. No permite UPDATE ni DELETE.

---

## 4. Tipos Enumerados

```sql
-- Tipo de usuario autenticable
CREATE TYPE tipo_usuario_auth AS ENUM ('CLIENTE', 'EMPLEADO');

-- Estado de la cuenta
CREATE TYPE estado_cuenta AS ENUM (
  'ACTIVA',                    -- Puede autenticarse
  'INACTIVA',                  -- Deshabilitada por admin
  'BLOQUEADA',                 -- Bloqueada por intentos fallidos
  'PENDIENTE_VERIFICACION'     -- Email no verificado
);

-- Estado de sesión
CREATE TYPE estado_sesion AS ENUM ('ACTIVA', 'REVOCADA', 'EXPIRADA');

-- Tipo de token de recuperación
CREATE TYPE tipo_token_recuperacion AS ENUM (
  'RECUPERACION_PASSWORD',
  'VERIFICACION_EMAIL'
);

-- Estado del token
CREATE TYPE estado_token AS ENUM ('PENDIENTE', 'USADO', 'EXPIRADO', 'INVALIDADO');

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
  'DESBLOQUEO_CUENTA'
);

-- Resultado del evento
CREATE TYPE resultado_auth AS ENUM ('EXITOSO', 'FALLIDO');
```

---

## 5. Relaciones

### 5.1 CuentaUsuario → Cliente

| Aspecto | Valor |
|---------|-------|
| Cardinalidad | 0..1 : 1 (Un cliente CON_CUENTA tiene exactamente una cuenta) |
| Dependencia | Cliente puede existir sin cuenta (SIN_CUENTA), cuenta requiere cliente |
| Eliminación | Si se elimina cliente, se inactiva la cuenta (no eliminar) |

### 5.2 CuentaUsuario → Empleado

| Aspecto | Valor |
|---------|-------|
| Cardinalidad | 0..1 : 1 (Un empleado activo tiene exactamente una cuenta) |
| Dependencia | Empleado puede existir sin cuenta (legacy), cuenta requiere empleado |
| Eliminación | Si se inactiva empleado, se inactiva la cuenta |

### 5.3 CuentaUsuario → SesionUsuario

| Aspecto | Valor |
|---------|-------|
| Cardinalidad | 1 : 0..* (Una cuenta puede tener múltiples sesiones) |
| Dependencia | Sesión no existe sin cuenta |
| Eliminación | Cascada (eliminar cuenta elimina sesiones) |

---

## 6. Reglas de Negocio

### 6.1 Creación de Cuenta

1. **Cliente**: Se crea CuentaUsuario automáticamente cuando un Cliente se registra como CON_CUENTA
2. **Empleado**: Se crea CuentaUsuario cuando un admin registra un nuevo empleado
3. **Email único**: No puede existir el mismo email para cliente y empleado
4. **Verificación**: Clientes requieren verificación de email; empleados no (admin los crea verificados)

### 6.2 Política de Bloqueo

1. **Umbral**: 5 intentos fallidos consecutivos
2. **Duración**: Bloqueo progresivo:
   - Primer bloqueo: 5 minutos
   - Segundo bloqueo: 15 minutos
   - Tercer bloqueo: 1 hora
   - Cuarto bloqueo+: 24 horas
3. **Reset**: Un login exitoso resetea el contador
4. **Desbloqueo manual**: Admin puede desbloquear antes de tiempo

### 6.3 Política de Contraseñas

1. **Longitud mínima**: 8 caracteres
2. **Complejidad**: Al menos una mayúscula, una minúscula, un número
3. **Historial**: No repetir las últimas 3 contraseñas (requiere tabla adicional si se implementa)
4. **Expiración empleados**: 90 días (configurable vía ParametroOperativo)
5. **Expiración clientes**: Sin expiración

### 6.4 Gestión de Sesiones

1. **Múltiples sesiones**: Permitidas (máximo 5 por usuario, configurable)
2. **Limpieza**: Job nocturno elimina sesiones expiradas
3. **Revocación masiva**: "Cerrar todas las sesiones" invalida todos los refresh tokens
4. **Logout**: Revoca solo la sesión actual

---

## 7. Operaciones del Backend

### 7.1 Operaciones de Escritura

| Operación | Descripción | Validaciones |
|-----------|-------------|--------------|
| RegistrarCliente | Crea Cliente + CuentaUsuario | Email único, password válido |
| CrearCuentaEmpleado | Crea CuentaUsuario para empleado existente | Empleado activo, sin cuenta previa |
| Login | Autentica y crea sesión | Credenciales válidas, cuenta activa |
| Logout | Revoca sesión actual | Sesión válida |
| RefreshToken | Renueva access token | Refresh token válido y no expirado |
| CambiarPassword | Actualiza contraseña | Password anterior correcto |
| SolicitarRecuperacion | Genera token de reset | Email existe |
| EjecutarRecuperacion | Cambia password con token | Token válido y no expirado |
| VerificarEmail | Marca email como verificado | Token válido |
| BloquearCuenta | Bloquea cuenta manualmente | Permiso admin |
| DesbloquearCuenta | Desbloquea cuenta | Permiso admin |
| RevocarTodasSesiones | Invalida todas las sesiones | Usuario autenticado o admin |

### 7.2 Operaciones de Lectura

| Operación | Descripción | Acceso |
|-----------|-------------|--------|
| ObtenerSesionesActivas | Lista sesiones del usuario | Usuario propietario |
| ObtenerLogActividad | Historial de auth del usuario | Usuario propietario o admin |
| ValidarToken | Verifica JWT | Público (para middleware) |

---

## 8. Integración con Entidades Existentes

### 8.1 Modificación a Cliente

```diff
Table cliente {
  id uuid [pk]
  tipo_cliente tipo_cliente [not null]
  // ... campos existentes ...
+ tiene_cuenta boolean [not null, default: false, note: 'Denormalizado para consultas rápidas']
}
```

**Nota**: El campo `tiene_cuenta` es redundante pero evita JOINs en consultas frecuentes. Se mantiene sincronizado vía triggers o lógica de aplicación.

### 8.2 Flujo de Registro de Cliente

```
1. Cliente completa formulario de registro
2. Se crea registro en tabla Cliente (tipo_cliente = CON_CUENTA)
3. Se crea registro en CuentaUsuario (estado = PENDIENTE_VERIFICACION)
4. Se crea ListaDeseos por defecto
5. Se inicializan PreferenciasNotificacion
6. Se envía email de verificación
7. Cliente hace clic en link → estado = ACTIVA
```

### 8.3 Flujo de Login

```
1. Usuario envía email + password
2. Buscar CuentaUsuario por email
3. Validar:
   - Cuenta existe
   - Estado = ACTIVA
   - No está bloqueada temporalmente
   - Password correcto (bcrypt compare)
4. Si falla:
   - Incrementar intentos_fallidos
   - Si >= 5: bloquear cuenta
   - Registrar en LogAutenticacion
5. Si éxito:
   - Resetear intentos_fallidos
   - Actualizar ultimo_login
   - Crear SesionUsuario con refresh token
   - Generar access token JWT
   - Registrar en LogAutenticacion
6. Retornar tokens
```

---

## 9. Estructura JWT

### 9.1 Access Token (Simplificado)

```json
{
  "type": "access",
  "user_type": "CLIENTE",
  "user_id": "uuid-cliente-o-empleado",
  "iat": 1704067200,
  "exp": 1704068100
}
```

| Campo | Descripción |
|-------|-------------|
| type | Tipo de token (access) |
| user_type | CLIENTE o EMPLEADO |
| user_id | UUID del Cliente o Empleado (no de CuentaUsuario) |
| iat | Issued at |
| exp | Expiration |

**TTL**:
- Cliente: 15 minutos
- Empleado: 30 minutos

**Datos que se consultan en BD (no en token)**:
- Email y datos de perfil
- Perfiles y permisos (empleados) - pueden cambiar sin invalidar token
- Estado de verificación de email
- Preferencias del usuario

### 9.2 Refresh Token

- Opaco (UUID v4)
- Solo almacenado hasheado en BD
- No contiene información decodificable

---

## 10. Diagrama DBML

```dbml
// ============================================
// CONTEXTO: AUTENTICACIÓN (NUEVO)
// ============================================

Table cuenta_usuario {
  id uuid [pk]
  email varchar(100) [not null, unique]
  password_hash varchar(255) [not null]
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
    email [unique]
    cliente_id [unique]
    empleado_id [unique]
    estado
  }
  
  note: 'Credenciales unificadas para clientes y empleados'
}

Table sesion_usuario {
  id uuid [pk]
  cuenta_usuario_id uuid [not null, ref: > cuenta_usuario.id]
  refresh_token_hash varchar(255) [not null, unique]
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
    cuenta_usuario_id
    (estado, fecha_expiracion)
  }
  
  note: 'Refresh tokens y sesiones activas'
}

Table token_recuperacion {
  id uuid [pk]
  cuenta_usuario_id uuid [not null, ref: > cuenta_usuario.id]
  tipo_token tipo_token_recuperacion [not null]
  token_hash varchar(255) [not null, unique]
  estado estado_token [not null, default: 'PENDIENTE']
  fecha_creacion timestamp [not null, default: `now()`]
  fecha_expiracion timestamp [not null]
  fecha_uso timestamp
  ip_solicitud varchar(45)
  ip_uso varchar(45)
  
  indexes {
    cuenta_usuario_id
    (tipo_token, estado)
  }
  
  note: 'Tokens de recuperación de password y verificación de email'
}

Table log_autenticacion {
  id uuid [pk]
  email_intento varchar(100) [not null]
  cuenta_usuario_id uuid [ref: > cuenta_usuario.id]
  tipo_evento tipo_evento_auth [not null]
  resultado resultado_auth [not null]
  motivo_fallo varchar(100)
  ip_address varchar(45) [not null]
  user_agent varchar(500)
  ubicacion varchar(100)
  metadata json
  fecha_evento timestamp [not null, default: `now()`]
  
  indexes {
    (email_intento, fecha_evento)
    (cuenta_usuario_id, fecha_evento)
    (tipo_evento, fecha_evento)
    (ip_address, fecha_evento)
  }
  
  note: 'INSERT-only. Auditoría de autenticación.'
}

// Enums
Enum tipo_usuario_auth { CLIENTE EMPLEADO }
Enum estado_cuenta { ACTIVA INACTIVA BLOQUEADA PENDIENTE_VERIFICACION }
Enum estado_sesion { ACTIVA REVOCADA EXPIRADA }
Enum tipo_token_recuperacion { RECUPERACION_PASSWORD VERIFICACION_EMAIL }
Enum estado_token { PENDIENTE USADO EXPIRADO INVALIDADO }
Enum tipo_evento_auth { LOGIN LOGOUT REFRESH_TOKEN CAMBIO_PASSWORD RECUPERACION_PASSWORD_SOLICITUD RECUPERACION_PASSWORD_USO VERIFICACION_EMAIL BLOQUEO_CUENTA DESBLOQUEO_CUENTA }
Enum resultado_auth { EXITOSO FALLIDO }
```

---

## 11. Parámetros Operativos Nuevos

| Clave | Valor Default | Descripción |
|-------|---------------|-------------|
| MAX_INTENTOS_LOGIN | 5 | Intentos antes de bloqueo |
| MINUTOS_BLOQUEO_INICIAL | 5 | Duración primer bloqueo |
| DIAS_EXPIRACION_PASSWORD_EMPLEADO | 90 | Días para forzar cambio |
| MAX_SESIONES_POR_USUARIO | 5 | Sesiones simultáneas permitidas |
| MINUTOS_EXPIRACION_TOKEN_RECUPERACION | 60 | Validez token de reset |
| HORAS_EXPIRACION_TOKEN_VERIFICACION | 24 | Validez token de verificación email |
| ACCESS_TOKEN_TTL_CLIENTE_MINUTOS | 15 | TTL access token cliente |
| ACCESS_TOKEN_TTL_EMPLEADO_MINUTOS | 30 | TTL access token empleado |
| REFRESH_TOKEN_TTL_CLIENTE_DIAS | 7 | TTL refresh token cliente |
| REFRESH_TOKEN_TTL_EMPLEADO_HORAS | 8 | TTL refresh token empleado |

---

## 12. Consideraciones de Seguridad

### 12.1 Almacenamiento de Contraseñas
- **Algoritmo**: bcrypt con cost factor 12
- **Nunca**: Almacenar en texto plano o con hash reversible

### 12.2 Tokens
- **Access Token**: JWT firmado con RS256 (clave asimétrica)
- **Refresh Token**: UUID v4, almacenado hasheado con SHA-256
- **Tokens de recuperación**: UUID v4 + timestamp, hasheados

### 12.3 Transmisión
- **HTTPS obligatorio**: Todos los endpoints de auth
- **Cookies HttpOnly**: Para refresh tokens en navegador
- **SameSite=Strict**: Prevención de CSRF

### 12.4 Rate Limiting
- **Login**: 10 intentos por minuto por IP
- **Recuperación**: 3 solicitudes por hora por email
- **Verificación**: 5 reenvíos por día por cuenta

---

## 13. Resumen de Entidades

| # | Entidad | Propósito | Relación Principal |
|---|---------|-----------|-------------------|
| 33 | CuentaUsuario | Credenciales de acceso | → Cliente o → Empleado |
| 34 | SesionUsuario | Refresh tokens activos | → CuentaUsuario |
| 35 | TokenRecuperacion | Reset password y verificación | → CuentaUsuario |
| 36 | LogAutenticacion | Auditoría de auth | → CuentaUsuario (opcional) |

**Total entidades del sistema**: 36 (32 existentes + 4 nuevas de autenticación)

---

## 14. Checklist de Implementación

### Base de Datos
- [ ] Crear tabla cuenta_usuario con CHECK constraint
- [ ] Crear tabla sesion_usuario
- [ ] Crear tabla token_recuperacion
- [ ] Crear tabla log_autenticacion (particionada por fecha recomendado)
- [ ] Crear índices especificados
- [ ] Agregar campo tiene_cuenta a cliente (opcional)

### Backend
- [ ] Implementar servicio de hashing (bcrypt)
- [ ] Implementar generación/validación JWT
- [ ] Implementar endpoints de auth (login, logout, refresh, etc.)
- [ ] Implementar middleware de autenticación
- [ ] Implementar guards por tipo de usuario
- [ ] Implementar job de limpieza de sesiones expiradas
- [ ] Implementar rate limiting

### Seguridad
- [ ] Configurar claves RSA para JWT
- [ ] Configurar CORS apropiadamente
- [ ] Implementar headers de seguridad
- [ ] Configurar cookies HttpOnly para refresh tokens

---

**Versión del Documento**: 1.0  
**Última Actualización**: Enero 2026  
**Estado**: Propuesto para revisión
