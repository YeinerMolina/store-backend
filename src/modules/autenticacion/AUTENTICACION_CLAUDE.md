# Módulo AUTENTICACION

**Contexto**: AUTENTICACION  
**Responsabilidad**: Gestión de credenciales, sesiones y control de acceso para clientes y empleados  
**Archivo de Entidades**: `AUTENTICACION_ENTITIES_CLAUDE.md`

---

## Visión del Módulo

AUTENTICACION es el guardián del acceso. Controla QUIÉN puede entrar al sistema y verifica su identidad de forma segura.

**Decisión Crítica**: Tabla unificada con discriminador. Un email NO puede ser simultáneamente cliente y empleado. El sistema determina automáticamente el tipo de usuario.

---

## Responsabilidades

1. **Gestión de Credenciales**: Crear y mantener cuentas de usuario (clientes CON_CUENTA y empleados)
2. **Autenticación**: Validar identidad mediante email + contraseña
3. **Gestión de Sesiones**: Manejo de access tokens (JWT) y refresh tokens (opacos)
4. **Recuperación de Contraseñas**: Flujo de reset vía email con tokens temporales
5. **Verificación de Email**: Validación de emails en registro de clientes
6. **Protección contra Fuerza Bruta**: Bloqueo automático por intentos fallidos
7. **Auditoría de Acceso**: Registro inmutable de eventos de autenticación
8. **Revocación de Sesiones**: Capacidad de invalidar sesiones específicas o todas

---

## Agregado: CuentaUsuario

**Root**: CuentaUsuario  
**Entidades**: SesionUsuario, TokenRecuperacion

**Invariantes**:

1. `email` único global (no puede repetirse entre clientes y empleados)
2. Exactamente UNO de `cliente_id` o `empleado_id` debe estar poblado según `tipo_usuario`
3. `intentos_fallidos` se resetea a 0 en login exitoso
4. `estado = BLOQUEADA` implica `bloqueado_hasta IS NOT NULL`
5. `email_verificado = false` implica `estado = PENDIENTE_VERIFICACION` (solo para clientes)
6. Una cuenta puede tener máximo `MAX_SESIONES_POR_USUARIO` sesiones activas simultáneas
7. `password_hash` NUNCA debe exponerse fuera del agregado

---

## Casos de Uso

### CU-AUTH-01: Registrar Cliente con Cuenta

**Actor**: Cliente (sin autenticar)

**Precondiciones**:

- Email no existe en sistema
- Contraseña cumple política de complejidad

**Flujo**:

1. Cliente completa formulario de registro (email, password, datos personales)
2. Sistema verifica que email no existe
3. Sistema valida complejidad de contraseña
4. **Transacción atómica**:
   - Crea registro en `Cliente` (tipo_cliente = CON_CUENTA, tiene_cuenta = true)
   - Genera hash bcrypt de contraseña (cost factor 12)
   - Crea `CuentaUsuario` (estado = PENDIENTE_VERIFICACION, email_verificado = false)
   - Crea `ListaDeseos` por defecto (desde PRE_VENTA)
   - Inicializa `PreferenciasNotificacion` (desde COMUNICACION)
5. Sistema genera token de verificación de email (UUID v4)
6. Sistema crea `TokenRecuperacion` (tipo = VERIFICACION_EMAIL, expiración 24h)
7. Sistema envía email con link de verificación
8. Evento: `CuentaClienteCreada`

**Flujos Alternativos**:

- Email ya existe → Error 409 Conflict
- Contraseña débil → Error 400 Bad Request con detalles

---

### CU-AUTH-02: Verificar Email

**Actor**: Cliente

**Precondiciones**:

- Token de verificación existe y está en estado PENDIENTE
- Token no ha expirado

**Flujo**:

1. Cliente hace clic en link de verificación (contiene token)
2. Sistema busca `TokenRecuperacion` por hash del token
3. Sistema valida:
   - Token existe
   - Estado = PENDIENTE
   - `fecha_expiracion > now()`
4. **Transacción atómica**:
   - Actualiza `TokenRecuperacion` (estado = USADO, fecha_uso = now())
   - Actualiza `CuentaUsuario` (email_verificado = true, estado = ACTIVA)
5. Sistema registra en `LogAutenticacion` (tipo = VERIFICACION_EMAIL, resultado = EXITOSO)
6. Evento: `EmailVerificado`

**Flujos Alternativos**:

- Token expirado → Permite reenviar nuevo token
- Token ya usado → Error 400 Bad Request
- Token no existe → Error 404 Not Found

---

### CU-AUTH-03: Crear Cuenta de Empleado

**Actor**: Admin/Empleado con permiso (desde SEGURIDAD)

**Precondiciones**:

- Empleado existe en sistema
- Empleado no tiene cuenta previa
- Email no existe en sistema

**Flujo**:

1. Admin ingresa email y contraseña temporal para empleado
2. Sistema verifica que email no existe
3. Sistema genera hash bcrypt de contraseña
4. Sistema crea `CuentaUsuario`:
   - tipo_usuario = EMPLEADO
   - empleado_id poblado
   - estado = ACTIVA
   - email_verificado = true (empleados se crean verificados)
   - `ultimo_cambio_password = NULL` (forzará cambio en primer login)
5. Sistema registra en `LogAutenticacion` (tipo = CREACION_CUENTA_EMPLEADO)
6. Sistema envía email con instrucciones de primer login
7. Evento: `CuentaEmpleadoCreada`

**Nota**: La contraseña temporal DEBE cambiarse en el primer login.

---

### CU-AUTH-04: Login

**Actor**: Cliente o Empleado

**Precondiciones**:

- Cuenta existe en sistema

**Flujo Principal**:

1. Usuario envía email + password
2. Sistema busca `CuentaUsuario` por email
3. Sistema valida estado de cuenta:
   - `estado = ACTIVA`
   - `bloqueado_hasta IS NULL OR bloqueado_hasta < now()`
4. Sistema compara password con hash bcrypt
5. **Si password correcto**:
   - Resetea `intentos_fallidos = 0`
   - Actualiza `ultimo_login = now()`
   - Genera access token JWT (RS256):
     ```json
     {
       "type": "access",
       "user_type": "CLIENTE" | "EMPLEADO",
       "user_id": "uuid-cliente-o-empleado",
       "account_id": "uuid-cuenta-usuario",
       "iat": timestamp,
       "exp": timestamp
     }
     ```
   - Genera refresh token opaco (UUID v4)
   - Hashea refresh token (SHA-256)
   - Crea `SesionUsuario`:
     - estado = ACTIVA
     - fecha_expiracion = now() + TTL (7 días cliente, 8h empleado)
     - dispositivo desde User-Agent header
   - Registra en `LogAutenticacion` (resultado = EXITOSO)
   - Retorna ambos tokens
6. Evento: `LoginExitoso`

**Flujos Alternativos**:

#### 4a. Cuenta No Activa

- Si `estado = PENDIENTE_VERIFICACION` → Error 403 con mensaje "Email no verificado"
- Si `estado = INACTIVA` → Error 403 "Cuenta deshabilitada"
- Si `estado = BLOQUEADA` → Error 403 "Cuenta bloqueada hasta [fecha]"

#### 4b. Password Incorrecto

1. Sistema incrementa `intentos_fallidos += 1`
2. Si `intentos_fallidos >= MAX_INTENTOS_LOGIN` (default: 5):
   - Calcula duración de bloqueo:
     - 1er bloqueo: 5 minutos
     - 2do bloqueo: 15 minutos
     - 3er bloqueo: 1 hora
     - 4to+ bloqueo: 24 horas
   - Actualiza `estado = BLOQUEADA`, `bloqueado_hasta = now() + duracion`
   - Registra en `LogAutenticacion` (tipo = BLOQUEO_CUENTA)
   - Evento: `CuentaBloqueada`
3. Registra intento fallido en `LogAutenticacion` (resultado = FALLIDO, motivo_fallo)
4. Retorna Error 401 "Credenciales inválidas" (sin revelar si email existe)

#### 4c. Cuenta de Empleado Requiere Cambio de Password

- Si `tipo_usuario = EMPLEADO` Y (`ultimo_cambio_password IS NULL` O `ultimo_cambio_password + 90 días < now()`):
  - Retorna 403 con payload especial:
    ```json
    {
      "error": "PASSWORD_CHANGE_REQUIRED",
      "message": "Debe cambiar su contraseña",
      "temp_token": "token-temporal-de-cambio"
    }
    ```

---

### CU-AUTH-05: Refresh Token

**Actor**: Cliente o Empleado autenticado

**Precondiciones**:

- Refresh token existe y es válido

**Flujo**:

1. Usuario envía refresh token opaco
2. Sistema hashea token recibido (SHA-256)
3. Sistema busca `SesionUsuario` por hash
4. Sistema valida:
   - Sesión existe
   - `estado = ACTIVA`
   - `fecha_expiracion > now()`
5. **Rotación de tokens**:
   - Genera nuevo access token JWT (igual estructura que login)
   - Genera nuevo refresh token opaco
   - Hashea nuevo refresh token
   - Actualiza `SesionUsuario`:
     - `refresh_token_hash` con nuevo hash
     - `fecha_ultimo_uso = now()`
     - `fecha_expiracion` se extiende (nuevo TTL)
6. Sistema registra en `LogAutenticacion` (tipo = REFRESH_TOKEN, resultado = EXITOSO)
7. Retorna nuevos tokens

**Flujos Alternativos**:

- Sesión expirada → Error 401, actualiza `estado = EXPIRADA`
- Sesión revocada → Error 401
- Token no existe → Error 401

**Nota**: El refresh token antiguo queda invalidado (rotación automática).

---

### CU-AUTH-06: Logout

**Actor**: Cliente o Empleado autenticado

**Flujo**:

1. Usuario envía solicitud de logout con refresh token
2. Sistema busca `SesionUsuario` por hash del token
3. Sistema actualiza sesión:
   - `estado = REVOCADA`
   - `fecha_revocacion = now()`
   - `motivo_revocacion = "Logout manual"`
4. Sistema registra en `LogAutenticacion` (tipo = LOGOUT, resultado = EXITOSO)
5. Sistema retorna 204 No Content

**Nota**: El access token JWT sigue siendo válido hasta su expiración natural (stateless), pero el refresh token queda inutilizable.

---

### CU-AUTH-07: Solicitar Recuperación de Contraseña

**Actor**: Cliente o Empleado (sin autenticar)

**Precondiciones**:

- Email existe en sistema

**Flujo**:

1. Usuario envía email de cuenta
2. Sistema busca `CuentaUsuario` por email
3. **Rate limiting**: Máximo 3 solicitudes por hora por cuenta
4. Sistema genera token de recuperación (UUID v4)
5. Sistema hashea token (SHA-256)
6. Sistema crea `TokenRecuperacion`:
   - tipo = RECUPERACION_PASSWORD
   - fecha_expiracion = now() + 1 hora
7. Sistema registra en `LogAutenticacion` (tipo = RECUPERACION_PASSWORD_SOLICITUD)
8. Sistema envía email con link de reset (contiene token en URL)
9. Retorna 200 OK (SIEMPRE, incluso si email no existe - anti-enumeración)

**Nota de Seguridad**: NO revelar si el email existe o no.

---

### CU-AUTH-08: Ejecutar Recuperación de Contraseña

**Actor**: Cliente o Empleado

**Precondiciones**:

- Token de recuperación existe y es válido
- Nueva contraseña cumple política

**Flujo**:

1. Usuario envía token + nueva contraseña
2. Sistema busca `TokenRecuperacion` por hash del token
3. Sistema valida:
   - Token existe
   - `estado = PENDIENTE`
   - `tipo_token = RECUPERACION_PASSWORD`
   - `fecha_expiracion > now()`
4. Sistema valida complejidad de nueva contraseña
5. **Transacción atómica**:
   - Genera nuevo hash bcrypt de contraseña
   - Actualiza `CuentaUsuario`:
     - `password_hash` con nuevo hash
     - `ultimo_cambio_password = now()`
     - `intentos_fallidos = 0`
     - Si `estado = BLOQUEADA`, cambiar a `ACTIVA` y `bloqueado_hasta = NULL`
   - Actualiza `TokenRecuperacion`:
     - `estado = USADO`
     - `fecha_uso = now()`
   - Revoca TODAS las sesiones activas (forzar re-login)
6. Sistema registra en `LogAutenticacion` (tipo = RECUPERACION_PASSWORD_USO, resultado = EXITOSO)
7. Evento: `PasswordRecuperado`

**Flujos Alternativos**:

- Token expirado → Error 400 "Token expirado"
- Token ya usado → Error 400 "Token ya utilizado"
- Contraseña débil → Error 400 con detalles

---

### CU-AUTH-09: Cambiar Contraseña (Autenticado)

**Actor**: Cliente o Empleado autenticado

**Precondiciones**:

- Usuario está autenticado
- Conoce contraseña actual

**Flujo**:

1. Usuario envía contraseña actual + nueva contraseña
2. Sistema obtiene `CuentaUsuario` desde JWT
3. Sistema valida contraseña actual con bcrypt
4. Sistema valida complejidad de nueva contraseña
5. Sistema genera nuevo hash bcrypt
6. **Transacción atómica**:
   - Actualiza `CuentaUsuario`:
     - `password_hash` con nuevo hash
     - `ultimo_cambio_password = now()`
   - Revoca todas las sesiones EXCEPTO la actual (opcional, configurable)
7. Sistema registra en `LogAutenticacion` (tipo = CAMBIO_PASSWORD, resultado = EXITOSO)
8. Evento: `PasswordCambiado`

**Flujos Alternativos**:

- Contraseña actual incorrecta → Error 401
- Nueva contraseña igual a actual → Error 400

---

### CU-AUTH-10: Revocar Todas las Sesiones

**Actor**: Cliente o Empleado autenticado

**Flujo**:

1. Usuario solicita cerrar todas las sesiones
2. Sistema busca todas las `SesionUsuario` del usuario con `estado = ACTIVA`
3. Para cada sesión:
   - Actualiza `estado = REVOCADA`
   - Actualiza `fecha_revocacion = now()`
   - Actualiza `motivo_revocacion = "Revocación masiva por usuario"`
4. Sistema registra en `LogAutenticacion` (tipo = REVOCACION_MASIVA)
5. Retorna cantidad de sesiones revocadas

**Uso Común**: Cuando el usuario sospecha acceso no autorizado.

---

### CU-AUTH-11: Desbloquear Cuenta (Admin)

**Actor**: Admin/Empleado con permiso

**Flujo**:

1. Admin selecciona cuenta bloqueada
2. Sistema verifica permiso `DESBLOQUEAR_CUENTA`
3. Sistema actualiza `CuentaUsuario`:
   - `estado = ACTIVA`
   - `bloqueado_hasta = NULL`
   - `intentos_fallidos = 0`
4. Sistema registra en `LogAutenticacion`:
   - tipo = DESBLOQUEO_CUENTA
   - metadata incluye `admin_id`
5. Sistema envía notificación al usuario sobre desbloqueo
6. Evento: `CuentaDesbloqueada`

---

## Reglas de Negocio

### RN-AUTH-01: Email Único Global

Un email NO puede existir simultáneamente como cliente y empleado. El primer registro "adueña" el email.

**Excepción**: Si un cliente SIN_CUENTA quiere registrarse CON_CUENTA usando el mismo email de su registro de tercero, se permite (conversión de tipo).

---

### RN-AUTH-02: Política de Contraseñas

#### Clientes:

- Mínimo 8 caracteres
- Al menos una mayúscula, una minúscula, un número
- Caracteres especiales opcionales pero recomendados
- Sin expiración temporal

#### Empleados:

- Mismas reglas que clientes
- **Expiración**: 90 días (configurable vía `ParametroOperativo`)
- **Forzar cambio**: Si `ultimo_cambio_password IS NULL` (primer login) o expirado

---

### RN-AUTH-03: Bloqueo Progresivo

| Número de Bloqueo | Duración |
| ----------------- | -------- |
| 1er bloqueo       | 5 min    |
| 2do bloqueo       | 15 min   |
| 3er bloqueo       | 1 hora   |
| 4to+ bloqueos     | 24 horas |

**Contador de bloqueos**: Tracked en metadata o tabla auxiliar (opcional).

---

### RN-AUTH-04: TTL de Tokens

| Tipo               | Cliente    | Empleado   |
| ------------------ | ---------- | ---------- |
| Access Token JWT   | 15 minutos | 30 minutos |
| Refresh Token      | 7 días     | 8 horas    |
| Token Recuperación | 1 hora     | 1 hora     |
| Token Verificación | 24 horas   | N/A        |

---

### RN-AUTH-05: Máximo de Sesiones Simultáneas

Por defecto: 5 sesiones activas por usuario. Configurable vía `MAX_SESIONES_POR_USUARIO`.

Cuando se alcanza el límite, la sesión más antigua se revoca automáticamente.

---

### RN-AUTH-06: Rate Limiting

| Operación              | Límite                 |
| ---------------------- | ---------------------- |
| Login                  | 10 intentos/min por IP |
| Recuperación           | 3 solicitudes/hora     |
| Verificación (reenvío) | 5 reenvíos/día         |
| Refresh Token          | 60 por hora            |

---

### RN-AUTH-07: Revocación de Sesiones en Eventos Críticos

Se revocan TODAS las sesiones automáticamente cuando:

- Se cambia contraseña vía recuperación
- Admin desactiva la cuenta
- Se detecta actividad sospechosa (implementación futura)

---

### RN-AUTH-08: Auditoría Inmutable

`LogAutenticacion` es INSERT-only. Cada evento de autenticación debe registrarse, incluso intentos fallidos con email inexistente (sin revelar cuenta_usuario_id).

---

## Eventos de Dominio

| Evento                 | Cuándo                          | Payload                                      |
| ---------------------- | ------------------------------- | -------------------------------------------- |
| `CuentaClienteCreada`  | Al registrar cliente CON_CUENTA | cuenta_id, cliente_id, email                 |
| `CuentaEmpleadoCreada` | Al crear cuenta de empleado     | cuenta_id, empleado_id, email                |
| `EmailVerificado`      | Al verificar email              | cuenta_id, email                             |
| `LoginExitoso`         | Login correcto                  | cuenta_id, tipo_usuario, ip, dispositivo     |
| `LoginFallido`         | Credenciales incorrectas        | email_intento, ip, motivo                    |
| `CuentaBloqueada`      | Al alcanzar umbral de intentos  | cuenta_id, bloqueado_hasta                   |
| `CuentaDesbloqueada`   | Desbloqueo manual o automático  | cuenta_id, admin_id (si manual)              |
| `PasswordCambiado`     | Cambio de contraseña            | cuenta_id, tipo_cambio (MANUAL/RECUPERACION) |
| `PasswordRecuperado`   | Reset vía token                 | cuenta_id, ip                                |
| `SesionRevocada`       | Logout o revocación             | sesion_id, motivo                            |
| `RefreshTokenRenovado` | Token refrescado                | cuenta_id, sesion_id                         |

---

## Integraciones

### PROVEE a:

- **TODOS LOS MÓDULOS**: Middleware de autenticación (`@RequireAuth`)
- **SEGURIDAD**: Información de cuenta para autorización de permisos
- **COMUNICACION**: Eventos para notificaciones de seguridad

### CONSUME de:

- **IDENTIDAD**: Cliente y Empleado (para crear cuentas y validar existencia)
- **PRE_VENTA**: Trigger de creación de ListaDeseos en registro de cliente
- **COMUNICACION**: Envío de emails de verificación y recuperación
- **CONFIGURACION**: Parámetros operativos de autenticación

---

## Consideraciones de Implementación

### Seguridad

#### Hashing de Contraseñas

- **Algoritmo**: bcrypt
- **Cost factor**: 12 (balance seguridad/rendimiento)
- **NUNCA** almacenar en texto plano

```typescript
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

async function comparePassword(
  plainPassword: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}
```

---

#### Access Tokens (JWT)

- **Algoritmo**: RS256 (asimétrico)
- **Clave privada**: Firmar tokens (solo backend)
- **Clave pública**: Verificar tokens (puede distribuirse)
- **Claims mínimos**:

```json
{
  "type": "access",
  "user_type": "CLIENTE" | "EMPLEADO",
  "user_id": "uuid",
  "account_id": "uuid",
  "iat": 1704067200,
  "exp": 1704068100
}
```

**NO incluir en JWT**:

- Email (puede cambiar)
- Perfiles/permisos (pueden cambiar sin invalidar token)
- Datos sensibles

---

#### Refresh Tokens

- **Opaco**: UUID v4 (no decodificable)
- **Almacenamiento**: Solo hash SHA-256 en BD
- **Rotación**: Cada vez que se usa, se genera uno nuevo
- **Transmisión**: HttpOnly cookie en web, secure storage en móvil

```typescript
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

function generateRefreshToken(): string {
  return randomUUID(); // UUID v4
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
```

---

#### HTTPS Obligatorio

- Todos los endpoints de autenticación deben usar HTTPS
- Middleware que rechaza conexiones HTTP en producción

---

#### Cookies Seguras (Web)

```typescript
response.cookie('refresh_token', token, {
  httpOnly: true, // No accesible desde JavaScript
  secure: true, // Solo HTTPS
  sameSite: 'strict', // Protección CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días para clientes
});
```

---

### Rate Limiting

Implementar con Redis:

```typescript
// Ejemplo conceptual
async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return current <= maxAttempts;
}

// Uso en login
const rateLimitKey = `login:${ip}`;
if (!(await checkRateLimit(rateLimitKey, 10, 60))) {
  throw new RateLimitExceededError();
}
```

---

### Jobs Background

#### Job: Expiración de Sesiones

- **Frecuencia**: Cada hora
- **Acción**: Actualizar sesiones con `fecha_expiracion < now()` a `estado = EXPIRADA`

```sql
UPDATE sesion_usuario
SET estado = 'EXPIRADA'
WHERE estado = 'ACTIVA' AND fecha_expiracion < NOW();
```

---

#### Job: Expiración de Tokens de Recuperación

- **Frecuencia**: Cada 15 minutos
- **Acción**: Actualizar tokens con `fecha_expiracion < now()` a `estado = EXPIRADO`

```sql
UPDATE token_recuperacion
SET estado = 'EXPIRADO'
WHERE estado = 'PENDIENTE' AND fecha_expiracion < NOW();
```

---

#### Job: Limpieza de Logs Antiguos

- **Frecuencia**: Semanal
- **Acción**: Archivar o eliminar logs de autenticación > 90 días (según política de retención)

---

### Índices Críticos

```sql
-- Búsqueda rápida por email en login
CREATE UNIQUE INDEX idx_cuenta_usuario_email ON cuenta_usuario (email);

-- Validación de unicidad por tipo
CREATE UNIQUE INDEX idx_cuenta_cliente ON cuenta_usuario (cliente_id) WHERE cliente_id IS NOT NULL;
CREATE UNIQUE INDEX idx_cuenta_empleado ON cuenta_usuario (empleado_id) WHERE empleado_id IS NOT NULL;

-- Consulta de sesiones activas
CREATE INDEX idx_sesion_cuenta_estado ON sesion_usuario (cuenta_usuario_id, estado);
CREATE INDEX idx_sesion_expiracion ON sesion_usuario (estado, fecha_expiracion);

-- Búsqueda de tokens por hash
CREATE UNIQUE INDEX idx_sesion_refresh_hash ON sesion_usuario (refresh_token_hash);
CREATE UNIQUE INDEX idx_token_recuperacion_hash ON token_recuperacion (token_hash);

-- Auditoría
CREATE INDEX idx_log_email_fecha ON log_autenticacion (email_intento, fecha_evento);
CREATE INDEX idx_log_cuenta_fecha ON log_autenticacion (cuenta_usuario_id, fecha_evento) WHERE cuenta_usuario_id IS NOT NULL;
```

---

### Middleware de Autenticación

```typescript
// Ejemplo conceptual de decorador
@RequireAuth() // Valida JWT y extrae usuario
async obtenerPerfil(@CurrentUser() user: AuthenticatedUser) {
  // user.id, user.type, user.accountId disponibles
}

@RequireAuth('EMPLEADO') // Solo empleados
async crearProducto() {}

@RequireAuth('CLIENTE')
async agregarAlCarrito() {}
```

---

### Validación de JWT

```typescript
// Verificación estándar
const payload = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
});

// Validar claims custom
if (payload.type !== 'access') {
  throw new InvalidTokenError();
}

// NO validar contra BD en cada request (stateless)
// Solo validar firma y expiración
```

---

### Manejo de Concurrencia

Para evitar race conditions en `intentos_fallidos`:

```sql
-- Incremento atómico
UPDATE cuenta_usuario
SET intentos_fallidos = intentos_fallidos + 1,
    fecha_modificacion = NOW()
WHERE id = ?
RETURNING intentos_fallidos;
```

---

## Excepciones del Dominio

| Excepción                    | Cuándo                                   | HTTP Status |
| ---------------------------- | ---------------------------------------- | ----------- |
| `EmailYaExisteError`         | Email duplicado en registro              | 409         |
| `CuentaNoEncontradaError`    | Cuenta no existe                         | 404         |
| `CredencialesInvalidasError` | Email o password incorrectos             | 401         |
| `CuentaBloqueadaError`       | Cuenta temporalmente bloqueada           | 403         |
| `CuentaInactivaError`        | Cuenta deshabilitada por admin           | 403         |
| `EmailNoVerificadoError`     | Email no verificado (cliente)            | 403         |
| `TokenInvalidoError`         | Token malformado o no existe             | 400         |
| `TokenExpiradoError`         | Token fuera de ventana de validez        | 400         |
| `TokenYaUsadoError`          | Token de recuperación ya consumido       | 400         |
| `SesionInvalidaError`        | Sesión no existe o revocada              | 401         |
| `PasswordDebilError`         | Contraseña no cumple política            | 400         |
| `RateLimitExceededError`     | Demasiados intentos en ventana de tiempo | 429         |
| `MaxSesionesAlcanzadoError`  | Usuario tiene max sesiones activas       | 400         |

---

## Diagramas de Flujo

### Flujo de Registro de Cliente

```
[Cliente] → Formulario de registro
    ↓
[AUTENTICACION] Valida email único
    ↓
[IDENTIDAD] Crea Cliente (tipo CON_CUENTA)
    ↓
[AUTENTICACION] Crea CuentaUsuario (estado PENDIENTE_VERIFICACION)
    ↓
[AUTENTICACION] Genera token verificación
    ↓
[COMUNICACION] Envía email con link
    ↓
[Cliente] Hace clic en link
    ↓
[AUTENTICACION] Valida token → Activa cuenta
    ↓
[PRE_VENTA] Crea ListaDeseos por defecto
    ↓
[COMUNICACION] Inicializa preferencias
    ↓
[Cliente] Puede hacer login
```

---

### Flujo de Login Exitoso

```
[Usuario] → POST /auth/login { email, password }
    ↓
[AUTENTICACION] Busca CuentaUsuario por email
    ↓
[AUTENTICACION] Valida estado (ACTIVA, no bloqueada)
    ↓
[AUTENTICACION] Compara password con hash bcrypt
    ↓
[AUTENTICACION] Resetea intentos_fallidos = 0
    ↓
[AUTENTICACION] Genera access token JWT (RS256)
    ↓
[AUTENTICACION] Genera refresh token opaco (UUID v4)
    ↓
[AUTENTICACION] Crea SesionUsuario con hash del refresh token
    ↓
[AUTENTICACION] Registra en LogAutenticacion (EXITOSO)
    ↓
[Usuario] ← { access_token, refresh_token, expires_in, user_type }
```

---

### Flujo de Login Fallido (Contraseña Incorrecta)

```
[Usuario] → POST /auth/login { email, password_incorrecto }
    ↓
[AUTENTICACION] Busca CuentaUsuario por email
    ↓
[AUTENTICACION] Compara password → NO COINCIDE
    ↓
[AUTENTICACION] Incrementa intentos_fallidos += 1
    ↓
¿intentos_fallidos >= 5?
    Sí → [AUTENTICACION] Bloquea cuenta (estado = BLOQUEADA)
         [AUTENTICACION] Calcula bloqueado_hasta (progresivo)
         [AUTENTICACION] Registra BLOQUEO_CUENTA en log
         [COMUNICACION] Notifica bloqueo de cuenta
    No → [AUTENTICACION] Solo registra intento fallido en log
    ↓
[Usuario] ← Error 401 "Credenciales inválidas"
```

---

### Flujo de Refresh Token

```
[Usuario] → POST /auth/refresh { refresh_token }
    ↓
[AUTENTICACION] Hashea refresh_token recibido (SHA-256)
    ↓
[AUTENTICACION] Busca SesionUsuario por hash
    ↓
[AUTENTICACION] Valida estado = ACTIVA y no expirada
    ↓
[AUTENTICACION] Genera NUEVO access token JWT
    ↓
[AUTENTICACION] Genera NUEVO refresh token opaco
    ↓
[AUTENTICACION] Actualiza SesionUsuario:
    - Nuevo refresh_token_hash
    - Nueva fecha_expiracion (renueva TTL)
    - fecha_ultimo_uso = now()
    ↓
[AUTENTICACION] Registra REFRESH_TOKEN en log
    ↓
[Usuario] ← { access_token, refresh_token, expires_in }

Nota: El refresh token ANTERIOR queda invalidado (rotación)
```

---

### Flujo de Recuperación de Contraseña

```
[Usuario] → POST /auth/forgot-password { email }
    ↓
[AUTENTICACION] Busca CuentaUsuario (sin revelar si existe)
    ↓
[AUTENTICACION] Verifica rate limit (3/hora)
    ↓
Si cuenta existe:
    [AUTENTICACION] Genera token recuperación (UUID v4)
    [AUTENTICACION] Hashea token (SHA-256)
    [AUTENTICACION] Crea TokenRecuperacion (expira en 1h)
    [COMUNICACION] Envía email con link de reset
    [AUTENTICACION] Registra RECUPERACION_PASSWORD_SOLICITUD en log
    ↓
[Usuario] ← 200 OK "Si el email existe, recibirá instrucciones"
    ↓
[Usuario] Hace clic en link → GET /auth/reset-password?token=...
    ↓
[Usuario] → POST /auth/reset-password { token, new_password }
    ↓
[AUTENTICACION] Busca TokenRecuperacion por hash
    ↓
[AUTENTICACION] Valida estado PENDIENTE y no expirado
    ↓
[AUTENTICACION] Valida complejidad de new_password
    ↓
[AUTENTICACION] Actualiza CuentaUsuario:
    - Nuevo password_hash
    - ultimo_cambio_password = now()
    - intentos_fallidos = 0
    - Si estaba bloqueada → ACTIVA
    ↓
[AUTENTICACION] Marca TokenRecuperacion como USADO
    ↓
[AUTENTICACION] Revoca TODAS las sesiones activas
    ↓
[AUTENTICACION] Registra RECUPERACION_PASSWORD_USO en log
    ↓
[COMUNICACION] Notifica cambio de contraseña exitoso
    ↓
[Usuario] ← 200 OK "Contraseña actualizada, por favor inicie sesión"
```

---

## Parámetros Operativos

Definidos en `CONFIGURACION`:

| Clave                                   | Valor Default | Descripción                                    |
| --------------------------------------- | ------------- | ---------------------------------------------- |
| `MAX_INTENTOS_LOGIN`                    | 5             | Intentos antes de bloqueo                      |
| `MINUTOS_BLOQUEO_INICIAL`               | 5             | Duración del primer bloqueo                    |
| `DIAS_EXPIRACION_PASSWORD_EMPLEADO`     | 90            | Días para forzar cambio de password            |
| `MAX_SESIONES_POR_USUARIO`              | 5             | Sesiones simultáneas permitidas                |
| `MINUTOS_EXPIRACION_TOKEN_RECUPERACION` | 60            | Validez del token de reset (1 hora)            |
| `HORAS_EXPIRACION_TOKEN_VERIFICACION`   | 24            | Validez del token de verificación (1 día)      |
| `ACCESS_TOKEN_TTL_CLIENTE_MINUTOS`      | 15            | TTL del access token para clientes             |
| `ACCESS_TOKEN_TTL_EMPLEADO_MINUTOS`     | 30            | TTL del access token para empleados            |
| `REFRESH_TOKEN_TTL_CLIENTE_DIAS`        | 7             | TTL del refresh token para clientes (7 días)   |
| `REFRESH_TOKEN_TTL_EMPLEADO_HORAS`      | 8             | TTL del refresh token para empleados (8 horas) |
| `RATE_LIMIT_LOGIN_POR_MINUTO`           | 10            | Máximo de intentos de login por IP/min         |
| `RATE_LIMIT_RECUPERACION_POR_HORA`      | 3             | Máximo de solicitudes de reset/hora            |
| `RATE_LIMIT_VERIFICACION_POR_DIA`       | 5             | Máximo de reenvíos de verificación/día         |

---

## Endpoints HTTP Propuestos

### POST /auth/register (Cliente)

- Body: `{ email, password, nombre, apellido, telefono, ... }`
- Response 201: `{ message: "Cuenta creada, verifique su email" }`

### POST /auth/verify-email

- Body: `{ token }`
- Response 200: `{ message: "Email verificado exitosamente" }`

### POST /auth/resend-verification

- Body: `{ email }`
- Response 200: `{ message: "Email de verificación reenviado" }`

### POST /auth/login

- Body: `{ email, password }`
- Response 200: `{ access_token, refresh_token, expires_in, user_type, user_id }`

### POST /auth/refresh

- Body: `{ refresh_token }`
- Response 200: `{ access_token, refresh_token, expires_in }`

### POST /auth/logout

- Body: `{ refresh_token }`
- Response 204 No Content

### POST /auth/forgot-password

- Body: `{ email }`
- Response 200: `{ message: "Si el email existe, recibirá instrucciones" }`

### POST /auth/reset-password

- Body: `{ token, new_password }`
- Response 200: `{ message: "Contraseña actualizada" }`

### POST /auth/change-password (Requiere autenticación)

- Headers: `Authorization: Bearer {access_token}`
- Body: `{ current_password, new_password }`
- Response 200: `{ message: "Contraseña cambiada exitosamente" }`

### GET /auth/sessions (Requiere autenticación)

- Headers: `Authorization: Bearer {access_token}`
- Response 200: `[ { id, dispositivo, fecha_creacion, fecha_ultimo_uso } ]`

### DELETE /auth/sessions/:id (Requiere autenticación)

- Headers: `Authorization: Bearer {access_token}`
- Response 204 No Content

### DELETE /auth/sessions (Revocar todas)

- Headers: `Authorization: Bearer {access_token}`
- Response 200: `{ message: "X sesiones revocadas" }`

### GET /auth/me (Requiere autenticación)

- Headers: `Authorization: Bearer {access_token}`
- Response 200: `{ account_id, email, user_type, user_id, email_verificado, ultimo_login }`

### POST /auth/employees (Admin - crear cuenta de empleado)

- Headers: `Authorization: Bearer {access_token}`
- Body: `{ empleado_id, email, temporary_password }`
- Response 201: `{ account_id, message: "Cuenta de empleado creada" }`

### POST /auth/unlock/:account_id (Admin - desbloquear cuenta)

- Headers: `Authorization: Bearer {access_token}`
- Response 200: `{ message: "Cuenta desbloqueada" }`

---

## Testing

### Unit Tests

- Factory de CuentaUsuario con distintos estados
- Validación de política de contraseñas
- Cálculo de duración de bloqueo progresivo
- Generación y validación de hashes

### Integration Tests

- Flujo completo de registro de cliente
- Flujo completo de login + refresh + logout
- Flujo de recuperación de contraseña
- Manejo de rate limiting
- Expiración automática de tokens

### E2E Tests

- Registrar cliente, verificar email, login exitoso
- Login fallido 5 veces → cuenta bloqueada
- Solicitar recuperación → cambiar password → sesiones revocadas
- Crear cuenta empleado → forzar cambio de password en primer login

---

**Referencia**: Ver `AUTENTICACION_ENTITIES_CLAUDE.md` para detalles de persistencia.
