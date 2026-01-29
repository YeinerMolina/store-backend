# 📋 Cambios de Validación y HTTP - Enero 2026

## 📌 Resumen Ejecutivo

Se han realizado mejoras significativas en la validación de entrada y la semántica HTTP del controller de Inventario:

1. ✅ **Decorador Composable**: Creado `@ValidateWith()` para reutilizar validación
2. ✅ **Semántica HTTP correcta**: Cambio de POST → PATCH para operaciones de actualización
3. ✅ **Eliminación de NO_CONTENT incorrecto**: Cambio a 200 OK con respuesta
4. ✅ **Documentación arquitectónica**: Guía completa de decoradores personalizados

---

## 🔧 Cambios en el Código

### 1. Decorador `@ValidateWith()` [NUEVO]

**Ubicación**: `src/shared/decorators/validate-with.decorator.ts`

**Propósito**: Simplificar validación Zod en controllers.

```typescript
/**
 * Applies Zod schema validation to a handler using a composable decorator.
 * Combines with @UsePipes internally to keep handler signatures clean.
 *
 * Side effects:
 * - Pipes are applied in order: earlier decorators execute first
 * - Validation errors throw BadRequestException with formatted Zod issues
 * - Type coercion follows Zod's strict mode rules
 *
 * @param schema - Zod schema for validating request body/query/params
 */
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
```

**Beneficios**:

- 🎯 Código más legible
- 🔄 Reutilizable entre controllers
- 🧩 Composable con otros decoradores
- 📦 Sigue convención NestJS

---

### 2. Cambios en InventarioController

#### Antes ❌

```typescript
@Post('consolidar')
@HttpCode(HttpStatus.NO_CONTENT)
async consolidarReserva(
  @Body(new ZodValidationPipe(ConsolidarReservaSchema))
  dto: ConsolidarReservaDto,
): Promise<void> {
  await this.inventarioService.consolidarReserva(dto);
}
```

**Problemas**:

- ❌ `NO_CONTENT` es incorrecto: retorna body pero promete no tenerlo
- ❌ `void` como retorno: no hay respuesta
- ❌ `new ZodValidationPipe()` repetido en cada handler
- ❌ `@Post` para actualización: semánticamente incorrecto

#### Después ✅

```typescript
@Patch('consolidar')
@ValidateWith(ConsolidarReservaSchema)
@HttpCode(HttpStatus.OK)
async consolidarReserva(
  @Body() dto: ConsolidarReservaDto,
): Promise<{ message: string }> {
  await this.inventarioService.consolidarReserva(dto);
  return { message: 'Reserva consolidada exitosamente' };
}
```

**Mejoras**:

- ✅ `@Patch`: semánticamente correcto para actualización
- ✅ `200 OK`: estándar HTTP correcto
- ✅ Retorna objeto: cliente tiene confirmación
- ✅ `@ValidateWith()`: decorador limpio y reutilizable

---

### 3. Cambios Aplicados a Todos los Handlers

| Handler                    | Antes    | Después   | HTTP Semántica  |
| -------------------------- | -------- | --------- | --------------- |
| `reservarInventario`       | POST 201 | POST 201  | ✅ Crea recurso |
| `consolidarReserva`        | POST 204 | PATCH 200 | ✅ Actualiza    |
| `ajustarInventario`        | POST 204 | PATCH 200 | ✅ Actualiza    |
| `consultarDisponibilidad`  | GET      | GET       | ✅ Sin cambios  |
| `obtenerInventarioPorItem` | GET      | GET       | ✅ Sin cambios  |

---

## 📚 Documentación Actualizada

### Nueva: `docs/arquitectura/DECORADORES_PERSONALIZADOS.md`

Guía completa sobre:

- ✅ Qué son los decoradores personalizados
- ✅ Cómo crear nuevos decoradores
- ✅ Ejemplos prácticos (`@ValidateWith()`, `@RequireRole()`, etc.)
- ✅ Composición de decoradores
- ✅ Errores comunes
- ✅ Testing decoradores
- ✅ Checklist para crear decoradores nuevos

### Actualizada: `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md`

Añadida sección completa:

- ✅ "✨ Validación con Decoradores Personalizados"
- ✅ Problema: repetición de pipes inline
- ✅ Solución: decorador composable
- ✅ Uso en controllers
- ✅ Ventajas comparadas
- ✅ Composición con otros decoradores

---

## 🧪 Respuesta HTTP Antes y Después

### Antes (INCORRECTO) ❌

**Request**:

```bash
PATCH /inventario/consolidar
{
  "operacionId": "123",
  "reservaId": "456"
}
```

**Response (actual pero incorrecto)**:

```
HTTP 204 NO_CONTENT

Body: (vacío)
```

**Problema**: HTTP 204 promete "sin contenido", pero el interceptor retorna algo:

```json
{
  "ok": true,
  "status": 204,
  "data": null,
  "errors": []
}
```

### Después (CORRECTO) ✅

**Request**:

```bash
PATCH /inventario/consolidar
{
  "operacionId": "123",
  "reservaId": "456"
}
```

**Response**:

```
HTTP 200 OK

{
  "ok": true,
  "status": 200,
  "data": {
    "message": "Reserva consolidada exitosamente"
  },
  "errors": []
}
```

**Beneficio**: HTTP status, content, y semanticidad son consistentes.

---

## 🎯 Impacto en Clientes HTTP

### Para Clientes Existentes

Si tienes clientes que esperaban 204 NO_CONTENT, necesitarán actualizarse:

```typescript
// Antes (NO FUNCIONA BIEN con interceptor)
if (response.status === 204) {
  console.log('Éxito (sin datos)');
}

// Después (CORRECTO)
if (response.status === 200) {
  console.log('Éxito:', response.body.data.message);
}
```

### Para Nuevos Clientes

Ya está documentado que todas las respuestas siguen la estructura `ApiResponse`:

```typescript
// Reutilizable para todos los endpoints
interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  errors: Array<{ campo: string; mensaje: string }>;
}
```

---

## 📊 Comparación: Inline Pipe vs @ValidateWith()

### Inline Pipe (ANTES)

```typescript
@Post('reservar')
async reservarInventario(
  @Body(new ZodValidationPipe(ReservarInventarioSchema))
  dto: ReservarInventarioDto,
): Promise<ReservaResponseDto> {
  return await this.inventarioService.reservarInventario(dto);
}

@Patch('consolidar')
async consolidarReserva(
  @Body(new ZodValidationPipe(ConsolidarReservaSchema))
  dto: ConsolidarReservaDto,
): Promise<{ message: string }> {
  // ...
}

@Patch('ajustar')
async ajustarInventario(
  @Body(new ZodValidationPipe(AjustarInventarioSchema))
  dto: AjustarInventarioDto,
): Promise<{ message: string }> {
  // ...
}
```

**Problemas**:

- ❌ 3 instanciaciones de `new ZodValidationPipe()`
- ❌ Verbose
- ❌ Difícil de leer

### @ValidateWith() (DESPUÉS)

```typescript
@Post('reservar')
@ValidateWith(ReservarInventarioSchema)
async reservarInventario(
  @Body() dto: ReservarInventarioDto,
): Promise<ReservaResponseDto> {
  return await this.inventarioService.reservarInventario(dto);
}

@Patch('consolidar')
@ValidateWith(ConsolidarReservaSchema)
async consolidarReserva(
  @Body() dto: ConsolidarReservaDto,
): Promise<{ message: string }> {
  // ...
}

@Patch('ajustar')
@ValidateWith(AjustarInventarioSchema)
async ajustarInventario(
  @Body() dto: AjustarInventarioDto,
): Promise<{ message: string }> {
  // ...
}
```

**Beneficios**:

- ✅ Decorador reutilizable
- ✅ Limpio y declarativo
- ✅ Fácil de leer
- ✅ Composable con otros decoradores

---

## 🚀 Próximos Pasos

1. **Revisar en PR**: Asegurar que todos los cambios se alineen con arquitectura
2. **Aplicar a otros modules**: Los otros controllers deberían usar `@ValidateWith()`
3. **Crear más decoradores**: `@RequireRole()`, `@RateLimit()`, etc.
4. **Actualizar OpenAPI**: Docs de Swagger reflejan HTTP codes correctos
5. **Comunicar a clientes**: Si hay breaking changes, notificar a usuarios de API

---

## 📞 Preguntas Frecuentes

### ¿Es un breaking change?

**Sí**, el cambio de 204 a 200 es un breaking change para clientes que verifican status codes específicos. Sin embargo:

- El cambio es OBLIGATORIO: 204 es incorrecto semánticamente
- Es mejor hacer breaking changes temprano
- La respuesta es MÁS informativa (incluye mensaje)

### ¿Por qué PATCH en lugar de PUT?

- **PATCH**: Actualización parcial (perfecto para `consolidar` y `ajustar`)
- **PUT**: Reemplazo completo (no aplica aquí)

Seguimos RFC 5789 (HTTP PATCH).

### ¿Qué pasa con los otros módulos?

Los otros módulos deberían:

1. ✅ Usar `@ValidateWith()` en sus controllers
2. ✅ Auditar uso incorrecto de HTTP codes
3. ✅ Eliminar `Promise<void>` retornando objetos de confirmación

---

## ✅ Checklist de Revisión

- [ ] Decorador `@ValidateWith()` implementado
- [ ] InventarioController actualizado
- [ ] Documentación de decoradores creada
- [ ] Documentación de arquitectura actualizada
- [ ] Tests pasando
- [ ] No hay compiler errors
- [ ] Exportaciones en `index.ts` correctas
- [ ] PR documentado con cambios

---

**Estado**: ✅ COMPLETO - Lista para revisar y mergear
