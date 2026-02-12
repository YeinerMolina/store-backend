# Refactorización del Módulo de Autenticación

**Fecha**: 12 de Febrero de 2026  
**Principio Aplicado**: Single Responsibility Principle (SRP)  
**Arquitectura**: Hexagonal + DDD

---

## Problema Original

El `AutenticacionApplicationService` violaba el **Principio de Responsabilidad Única** al tener **6 responsabilidades diferentes** en un solo servicio con **14 métodos públicos**.

### Responsabilidades Mezcladas (Antes)

| Responsabilidad             | Métodos                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Registro de Cuentas         | `registrarCliente`, `crearCuentaEmpleado` (2)                                          |
| Autenticación               | `login`, `refreshToken`, `logout` (3)                                                  |
| Verificación de Email       | `verificarEmail` (1)                                                                   |
| Recuperación de Contraseñas | `solicitarRecuperacionPassword`, `ejecutarRecuperacionPassword`, `cambiarPassword` (3) |
| Gestión de Sesiones         | `revocarTodasLasSesiones`, `obtenerSesionesActivas`, `revocarSesion` (3)               |
| Administración de Cuentas   | `desbloquearCuenta`, `obtenerInformacionCuenta` (2)                                    |

---

## Solución Implementada

División en **6 servicios especializados** + **3 servicios internos compartidos**.

### Nueva Estructura de Puertos Inbound

```typescript
// 1️⃣ Registro de Cuentas
domain/ports/inbound/registro-cuenta.service.ts
├── registrarCliente()
└── crearCuentaEmpleado()

// 2️⃣ Autenticación (refactorizado)
domain/ports/inbound/autenticacion.service.ts
├── login()
├── refreshToken()
└── logout()

// 3️⃣ Verificación de Email
domain/ports/inbound/verificacion-email.service.ts
└── verificarEmail()

// 4️⃣ Gestión de Contraseñas
domain/ports/inbound/gestion-password.service.ts
├── solicitarRecuperacionPassword()
├── ejecutarRecuperacionPassword()
└── cambiarPassword()

// 5️⃣ Gestión de Sesiones
domain/ports/inbound/gestion-sesiones.service.ts
├── revocarTodasLasSesiones()
├── obtenerSesionesActivas()
└── revocarSesion()

// 6️⃣ Administración de Cuentas
domain/ports/inbound/admin-cuenta.service.ts
├── desbloquearCuenta()
└── obtenerInformacionCuenta()
```

### Servicios de Aplicación

```
application/services/
├── autenticacion-application.service.ts               (3 métodos)
├── registro-cuenta-application.service.ts             (2 métodos)
├── verificacion-email-application.service.ts          (1 método)
├── gestion-password-application.service.ts            (3 métodos)
├── gestion-sesiones-application.service.ts            (3 métodos)
├── admin-cuenta-application.service.ts                (2 métodos)
└── internal/                                          ← Servicios compartidos (NO puertos)
    ├── cuenta-validation.service.ts                   (5 métodos)
    ├── token-recovery.service.ts                      (3 métodos)
    └── sesion-management.service.ts                   (7 métodos)
```

### Tokens de Inyección de Dependencias

Nuevos tokens añadidos en `domain/ports/tokens.ts`:

```typescript
export const REGISTRO_CUENTA_SERVICE_TOKEN = Symbol('REGISTRO_CUENTA_SERVICE');
export const VERIFICACION_EMAIL_SERVICE_TOKEN = Symbol(
  'VERIFICACION_EMAIL_SERVICE',
);
export const GESTION_PASSWORD_SERVICE_TOKEN = Symbol(
  'GESTION_PASSWORD_SERVICE',
);
export const GESTION_SESIONES_SERVICE_TOKEN = Symbol(
  'GESTION_SESIONES_SERVICE',
);
export const ADMIN_CUENTA_SERVICE_TOKEN = Symbol('ADMIN_CUENTA_SERVICE');
```

---

## Beneficios Conseguidos

### 1. Single Responsibility Principle ✅

Cada servicio tiene UNA razón para cambiar:

- Cambios en flujo de login → Solo `AutenticacionApplicationService`
- Cambios en recuperación de password → Solo `GestionPasswordApplicationService`
- Cambios en gestión de sesiones → Solo `GestionSesionesApplicationService`

### 2. Reducción de Complejidad

**Antes**:

- 1 servicio con 14 métodos públicos + 11 métodos privados = **700+ líneas**

**Después**:

- 6 servicios especializados (promedio 100 líneas cada uno)
- 3 servicios internos compartidos (código reutilizable)
- Total: **~900 líneas** (distribuidas en 9 archivos)

### 3. Mejor Testabilidad

Cada servicio puede testearse aisladamente con menos mocks:

```typescript
// Antes: mockear 10 dependencias para testear login
describe('AutenticacionService', () => {
  // 10 providers mockeados
});

// Después: solo 6 dependencias para testear login
describe('AutenticacionApplicationService', () => {
  // 6 providers (menos superficie de test)
});
```

### 4. Reutilización de Código

Servicios internos encapsulan lógica común:

- `CuentaValidationService`: Validaciones de cuentas
- `TokenRecoveryService`: Manejo de tokens de recuperación
- `SesionManagementService`: Operaciones con sesiones

### 5. Cumple con Arquitectura Hexagonal

Todos los servicios siguen siendo **puertos inbound** con implementaciones en `application/services/`. No se rompe ninguna regla hexagonal.

---

## Comparativa de Tamaños

| Servicio                       | Métodos Públicos | Dependencias Inyectadas | Líneas Aprox |
| ------------------------------ | ---------------- | ----------------------- | ------------ |
| **Autenticacion**              | 3                | 6                       | 150          |
| **RegistroCuenta**             | 2                | 7                       | 120          |
| **VerificacionEmail**          | 1                | 3                       | 50           |
| **GestionPassword**            | 3                | 6                       | 130          |
| **GestionSesiones**            | 3                | 3                       | 90           |
| **AdminCuenta**                | 2                | 3                       | 70           |
| **CuentaValidation** (interno) | 5                | 3                       | 80           |
| **TokenRecovery** (interno)    | 3                | 3                       | 130          |
| **SesionManagement** (interno) | 7                | 4                       | 180          |

---

## Módulo NestJS Actualizado

El módulo `autenticacion.module.ts` ahora registra todos los servicios:

```typescript
@Module({
  providers: [
    // Servicios públicos (puertos)
    {
      provide: AUTENTICACION_SERVICE_TOKEN,
      useClass: AutenticacionApplicationService,
    },
    {
      provide: REGISTRO_CUENTA_SERVICE_TOKEN,
      useClass: RegistroCuentaApplicationService,
    },
    {
      provide: VERIFICACION_EMAIL_SERVICE_TOKEN,
      useClass: VerificacionEmailApplicationService,
    },
    {
      provide: GESTION_PASSWORD_SERVICE_TOKEN,
      useClass: GestionPasswordApplicationService,
    },
    {
      provide: GESTION_SESIONES_SERVICE_TOKEN,
      useClass: GestionSesionesApplicationService,
    },
    {
      provide: ADMIN_CUENTA_SERVICE_TOKEN,
      useClass: AdminCuentaApplicationService,
    },

    // Servicios internos (no exportados)
    CuentaValidationService,
    TokenRecoveryService,
    SesionManagementService,
  ],
  exports: [
    AUTENTICACION_SERVICE_TOKEN,
    REGISTRO_CUENTA_SERVICE_TOKEN,
    VERIFICACION_EMAIL_SERVICE_TOKEN,
    GESTION_PASSWORD_SERVICE_TOKEN,
    GESTION_SESIONES_SERVICE_TOKEN,
    ADMIN_CUENTA_SERVICE_TOKEN,
  ],
})
export class AutenticacionModule {}
```

---

## Próximos Pasos (TODO)

### 1. Crear Controllers Especializados

**Actualmente**: No hay controllers implementados.

**Recomendado**:

```
infrastructure/controllers/
├── autenticacion.controller.ts          (POST /login, /logout, /refresh)
├── registro-cuenta.controller.ts        (POST /registro/cliente, /registro/empleado)
├── verificacion-email.controller.ts     (POST /verificacion/email)
├── gestion-password.controller.ts       (POST /password/recuperar, /password/reset, /password/cambiar)
├── gestion-sesiones.controller.ts       (GET /sesiones, DELETE /sesiones/:id)
└── admin-cuenta.controller.ts           (POST /admin/cuentas/:id/desbloquear, GET /admin/cuentas/:id)
```

### 2. Implementar Tests Unitarios

Cada servicio necesita su suite de tests:

```
application/services/__tests__/
├── autenticacion-application.service.spec.ts
├── registro-cuenta-application.service.spec.ts
├── verificacion-email-application.service.spec.ts
├── gestion-password-application.service.spec.ts
├── gestion-sesiones-application.service.spec.ts
├── admin-cuenta-application.service.spec.ts
└── internal/
    ├── cuenta-validation.service.spec.ts
    ├── token-recovery.service.spec.ts
    └── sesion-management.service.spec.ts
```

### 3. Implementar Ports Outbound Faltantes

Los siguientes puertos están definidos pero no implementados:

- `PasswordHasher` → `infrastructure/adapters/bcrypt-password-hasher.adapter.ts`
- `TokenGenerator` → `infrastructure/adapters/crypto-token-generator.adapter.ts`
- `JwtService` → `infrastructure/adapters/jwt-service.adapter.ts`
- `EmailService` → `infrastructure/adapters/email-service.adapter.ts`
- `ClientePort` → `infrastructure/adapters/cliente-http.adapter.ts`
- `EmpleadoPort` → `infrastructure/adapters/empleado-http.adapter.ts`
- `ConfiguracionPort` → `infrastructure/adapters/configuracion-http.adapter.ts`

### 4. Eliminar Archivo Backup

```bash
rm src/modules/autenticacion/application/services/autenticacion-application.service.old.ts
```

---

## Migración para Consumidores

Si otros módulos usaban `AutenticacionService`, ahora deben especificar qué servicio necesitan:

**Antes**:

```typescript
constructor(
  @Inject(AUTENTICACION_SERVICE_TOKEN)
  private readonly autenticacionService: AutenticacionService
) {}
```

**Después** (según necesidad):

```typescript
// Para login/logout
constructor(
  @Inject(AUTENTICACION_SERVICE_TOKEN)
  private readonly autenticacionService: AutenticacionService
) {}

// Para registro
constructor(
  @Inject(REGISTRO_CUENTA_SERVICE_TOKEN)
  private readonly registroService: RegistroCuentaService
) {}

// Para gestión de sesiones
constructor(
  @Inject(GESTION_SESIONES_SERVICE_TOKEN)
  private readonly sesionesService: GestionSesionesService
) {}
```

---

## Archivos Modificados/Creados

### Puertos Inbound (NUEVOS)

- ✅ `domain/ports/inbound/registro-cuenta.service.ts`
- ✅ `domain/ports/inbound/verificacion-email.service.ts`
- ✅ `domain/ports/inbound/gestion-password.service.ts`
- ✅ `domain/ports/inbound/gestion-sesiones.service.ts`
- ✅ `domain/ports/inbound/admin-cuenta.service.ts`
- ✅ `domain/ports/inbound/autenticacion.service.ts` (REFACTORIZADO)

### Servicios de Aplicación (NUEVOS)

- ✅ `application/services/registro-cuenta-application.service.ts`
- ✅ `application/services/verificacion-email-application.service.ts`
- ✅ `application/services/gestion-password-application.service.ts`
- ✅ `application/services/gestion-sesiones-application.service.ts`
- ✅ `application/services/admin-cuenta-application.service.ts`
- ✅ `application/services/autenticacion-application.service.ts` (REFACTORIZADO)

### Servicios Internos (NUEVOS)

- ✅ `application/services/internal/cuenta-validation.service.ts`
- ✅ `application/services/internal/token-recovery.service.ts`
- ✅ `application/services/internal/sesion-management.service.ts`

### Infraestructura

- ✅ `autenticacion.module.ts` (CREADO)
- ✅ `domain/ports/tokens.ts` (MODIFICADO - 5 tokens nuevos)

### Backup

- ✅ `application/services/autenticacion-application.service.old.ts` (BACKUP - eliminar después)

---

## Conclusión

Esta refactorización transforma un servicio monolítico de 700+ líneas con 6 responsabilidades mezcladas en **9 servicios cohesivos y especializados**, cada uno con una responsabilidad clara y bien definida.

El código ahora es:

- ✅ Más mantenible (cambios aislados)
- ✅ Más testeable (menos dependencias por servicio)
- ✅ Más reutilizable (servicios internos compartidos)
- ✅ Más escalable (fácil agregar nueva funcionalidad)
- ✅ Cumple con SRP (Single Responsibility Principle)
- ✅ Cumple con Arquitectura Hexagonal (puertos y adaptadores correctos)

**No se rompió ninguna regla de arquitectura hexagonal**. Todos los servicios siguen siendo puertos inbound válidos con implementaciones en la capa de aplicación.
