# Decoradores Personalizados - NestJS

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Status**: Estándar de Proyecto

---

## 📌 Visión General

Los decoradores personalizados son la forma estándar de reutilizar lógica transversal en NestJS de manera legible y composable. Este documento define los decoradores disponibles en el proyecto y cómo crearlos.

---

## 🎯 Principios Fundamentales

1. **DRY (Don't Repeat Yourself)**: Un decorador reutilizable es mejor que código repetido en múltiples handlers
2. **Composabilidad**: Los decoradores se combinan sin conflictos
3. **Claridad**: El nombre del decorador debe expresar su intención
4. **Responsabilidad Única**: Un decorador = una responsabilidad

---

## 📚 Decoradores Disponibles

### `@ValidateWith(schema: ZodSchema)`

**Ubicación**: `src/shared/decorators/validate-with.decorator.ts`

**Propósito**: Validar entrada (body, query, params) usando un esquema Zod.

**Ejemplo**:

```typescript
@Post('reservar')
@ValidateWith(ReservarInventarioSchema)
async reservarInventario(@Body() dto: ReservarInventarioDto) { }
```

**Detrás del telón**:

- Crea un `ZodValidationPipe` internamente
- El pipe se aplica con `@UsePipes()`
- Si la validación falla, retorna `BadRequestException` con errores formateados

**¿Por qué un decorador?**

- **Antes**: `@Body(new ZodValidationPipe(ReservarInventarioSchema))`
- **Después**: `@ValidateWith(ReservarInventarioSchema)`
- **Ventaja**: Limpio, legible, reutilizable

---

## 🏗️ Cómo Crear un Decorador Personalizado

### Template Básico

````typescript
// src/shared/decorators/{nombre}.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Type } from '@nestjs/common';

/**
 * [Descripción en 1-2 líneas de QUÉ hace]
 *
 * Side effects:
 * - [Efectos secundarios no obvios]
 *
 * @param [parámetros]
 *
 * @example
 * ```typescript
 * @[NombreDecorador]([args])
 * async miHandler() { }
 * ```
 *
 * @see {@link [ClaseRelacionada]} para detalles
 */
export function NombreDecorador(...args: any[]) {
  return applyDecorators(
    // Lista de decoradores que se aplican
    Decorator1(...),
    Decorator2(...),
  );
}
````

---

## 📋 Ejemplos Prácticos

### Ejemplo 1: `@ValidateWith()` (Decorador Simple)

```typescript
// src/shared/decorators/validate-with.decorator.ts
import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Applies Zod schema validation to a handler using a composable decorator.
 * Combines with @UsePipes internally to keep handler signatures clean.
 *
 * Side effects:
 * - Pipes are applied in order: earlier decorators execute first
 * - Validation errors throw BadRequestException with formatted Zod issues
 *
 * @param schema - Zod schema for validating request body/query/params
 */
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
```

**Uso**:

```typescript
@Post('crear')
@ValidateWith(CrearInventarioSchema)
async crear(@Body() dto: CrearInventarioDto) { }
```

---

### Ejemplo 2: `@RequireRole()` (Decorador con Guards)

```typescript
// src/shared/decorators/require-role.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';

/**
 * Restricts handler access to users with specified roles.
 *
 * Side effects:
 * - Extracts user from request context (expects @CurrentUser())
 * - Throws UnauthorizedException if roles don't match
 * - Must be used with RolesModule imported
 *
 * @param roles - Array of allowed roles
 */
export function RequireRole(...roles: string[]) {
  return applyDecorators(SetMetadata('roles', roles), UseGuards(RolesGuard));
}
```

**Uso**:

```typescript
@Post('crear')
@RequireRole('ADMIN', 'MANAGER')
async crear(@Body() dto: CrearInventarioDto) { }
```

---

### Ejemplo 3: `@RateLimit()` (Decorador con Metadata)

```typescript
// src/shared/decorators/rate-limit.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';

/**
 * Limits request rate for a handler.
 *
 * Side effects:
 * - Requires RateLimitInterceptor to be globally registered
 * - Throws TooManyRequestsException if limit exceeded
 * - Windows are per-IP and tracked in Redis
 *
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function RateLimit(maxRequests: number, windowMs: number = 60000) {
  return applyDecorators(SetMetadata('rateLimit', { maxRequests, windowMs }));
}
```

**Uso**:

```typescript
@Get('listo')
@RateLimit(100, 60000) // 100 requests per minute
async listo() {
  return { status: 'ok' };
}
```

---

### Ejemplo 4: Decorador Composable Complejo

```typescript
// src/shared/decorators/secure-operation.decorator.ts
import {
  applyDecorators,
  UseGuards,
  UseInterceptors,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

/**
 * Combines authentication, authorization, and auditing for sensitive operations.
 * Automatically logs all access attempts.
 *
 * Side effects:
 * - Requires JWT token in Authorization header
 * - Logs operation in audit table with user ID and timestamp
 * - Throws UnauthorizedException if token invalid
 *
 * @param requiredRoles - Roles allowed to perform operation
 */
export function SecureOperation(...requiredRoles: string[]) {
  return applyDecorators(
    UseGuards(AuthGuard('jwt')),
    SetMetadata('roles', requiredRoles),
    UseInterceptors(AuditInterceptor),
    SetMetadata('audit', true),
  );
}
```

**Uso**:

```typescript
@Post('eliminar')
@SecureOperation('ADMIN')
async eliminar(@Param('id') id: string) { }
```

---

## 🔄 Composición de Decoradores

### Orden de Aplicación

```typescript
@Post('crear')                         // 1. Definir ruta HTTP
@ValidateWith(CrearSchema)             // 2. Validar entrada
@RequireRole('ADMIN')                  // 3. Autorizar
@RateLimit(50)                         // 4. Rate limiting
@SecureOperation('WRITE')              // 5. Auditoría
async crear(@Body() dto: CrearDto) { }
```

**Orden de ejecución (runtime)**:

1. Guards (`@RequireRole`, `@SecureOperation`)
2. Pipes (`@ValidateWith`)
3. Interceptors (request) (`@SecureOperation`)
4. Handler
5. Interceptors (response)

---

## 📂 Organización de Decoradores

```
src/shared/decorators/
├── validate-with.decorator.ts      ← Validación
├── require-role.decorator.ts        ← Autenticación/Autorización
├── rate-limit.decorator.ts          ← Rate limiting
├── secure-operation.decorator.ts    ← Composado (multi-responsabilidad)
└── index.ts                         ← Exportar todos
```

**Archivo de índice** (`index.ts`):

```typescript
export { ValidateWith } from './validate-with.decorator';
export { RequireRole } from './require-role.decorator';
export { RateLimit } from './rate-limit.decorator';
export { SecureOperation } from './secure-operation.decorator';
```

**Importar en controllers**:

```typescript
import {
  ValidateWith,
  RequireRole,
  RateLimit,
  SecureOperation,
} from '@shared/decorators';
```

---

## ⚠️ Errores Comunes

### ❌ Error 1: No usar `applyDecorators()`

```typescript
// ❌ MAL: Decorador simple (no composable)
export function ValidateWith(schema: ZodSchema) {
  return UsePipes(new ZodValidationPipe(schema));
}

// ✅ BIEN: Usa applyDecorators()
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
```

**Razón**: `applyDecorators()` permite composición correcta.

---

### ❌ Error 2: Lógica en el Decorador

```typescript
// ❌ MAL: Decorador con efectos secundarios
export function MiDecorador() {
  console.log('Se está ejecutando el decorador'); // ❌ NUNCA
  return applyDecorators(...);
}

// ✅ BIEN: Lógica en Guards/Interceptors/Pipes
export function MiDecorador() {
  return applyDecorators(
    UseGuards(MiGuard), // ← Lógica aquí
  );
}
```

**Razón**: Los decoradores se aplican en **tiempo de compilación/arranque**, no en **tiempo de request**.

---

### ❌ Error 3: Decorador con Inyección de Dependencias

```typescript
// ❌ MAL: Decorador intenta inyectar servicios
export function MiDecorador() {
  return applyDecorators(
    UseGuards(new MiGuard(servicioInyectado)), // ❌ No funciona
  );
}

// ✅ BIEN: Usar clase (NestJS inyecta en constructor)
@Injectable()
export class MiGuard implements CanActivate {
  constructor(private servicio: MiServicio) {} // ← Inyección
}

export function MiDecorador() {
  return applyDecorators(
    UseGuards(MiGuard), // ← Solo la clase
  );
}
```

---

## 🧪 Testing Decoradores

### Decorador Validador

```typescript
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

describe('ValidateWith Decorator', () => {
  it('debería validar correctamente con esquema válido', async () => {
    @Controller()
    class TestController {
      @Post()
      @ValidateWith(TestSchema)
      test(@Body() body: any) {
        return body;
      }
    }

    const request = { body: { validField: 'value' } };
    // El pipe se aplica automáticamente en NestJS
  });

  it('debería lanzar BadRequestException con entrada inválida', async () => {
    // Fixture de test
  });
});
```

---

## 📚 Referencias

- [NestJS Decorators](https://docs.nestjs.com/custom-decorators)
- [NestJS Pipes](https://docs.nestjs.com/pipes)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)

---

## ✅ Checklist: Crear Decorador Nuevo

- [ ] Crear archivo en `src/shared/decorators/{nombre}.decorator.ts`
- [ ] Usar `applyDecorators()` como contenedor
- [ ] Documentar con JSDoc (qué, lado effects, ejemplo)
- [ ] Exportar en `src/shared/decorators/index.ts`
- [ ] Escribir tests unitarios
- [ ] Actualizar esta documentación
- [ ] Revisar en PR (asegurar responsabilidad única)
