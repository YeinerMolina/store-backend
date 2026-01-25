# Pipes de Validación

## ZodValidationPipe

Pipe personalizado para validar DTOs usando **Zod** en lugar de class-validator.

### Ventajas sobre class-validator

| Característica           | Zod                               | class-validator           |
| ------------------------ | --------------------------------- | ------------------------- |
| **Type Safety**          | ✅ Inferencia automática          | ❌ Manual con decoradores |
| **Performance**          | ✅ ~3x más rápido                 | ⚠️ Reflection overhead    |
| **Bundle Size**          | ✅ ~8kb                           | ⚠️ ~100kb+                |
| **Composición**          | ✅ Nativa                         | ❌ Limitada               |
| **Transformaciones**     | ✅ Integradas (coerce, transform) | ⚠️ Pipe separado          |
| **Mensajes de error**    | ✅ Customizables y claros         | ⚠️ Genéricos              |
| **Runtime + Build time** | ✅ Ambos                          | ❌ Solo runtime           |

---

## Uso

### 1. Definir Schema Zod

```typescript
// src/modules/inventario/application/schemas/inventario.schemas.ts
import { z } from 'zod';

export const ReservarInventarioSchema = z.object({
  tipoItem: z.enum(['PRODUCTO', 'PAQUETE']),
  itemId: z.string().uuid(),
  cantidad: z.number().int().positive(),
});

export type ReservarInventarioDto = z.infer<typeof ReservarInventarioSchema>;
```

### 2. Usar en Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import {
  ReservarInventarioSchema,
  type ReservarInventarioDto,
} from './schemas';

@Controller('inventario')
export class InventarioController {
  @Post('reservar')
  async reservar(
    @Body(new ZodValidationPipe(ReservarInventarioSchema))
    dto: ReservarInventarioDto,
  ) {
    // dto está validado y tipado automáticamente
    return this.service.reservar(dto);
  }
}
```

### 3. Query Params (GET requests)

Para query params que llegan como strings, usar `z.coerce`:

```typescript
export const ConsultarDisponibilidadSchema = z.object({
  tipoItem: z.enum(['PRODUCTO', 'PAQUETE']),
  itemId: z.string().uuid(),
  cantidad: z.coerce.number().int().positive(), // ← Convierte "5" → 5
});

// Uso:
@Get('disponibilidad')
async consultarDisponibilidad(
  @Query(new ZodValidationPipe(ConsultarDisponibilidadSchema))
  query: ConsultarDisponibilidadDto,
) {
  // query.cantidad es number, no string
}
```

---

## Formato de Errores

Cuando falla la validación, el pipe devuelve:

```json
{
  "mensaje": "Error de validación",
  "errores": [
    {
      "campo": "cantidad",
      "mensaje": "Expected number, received string",
      "codigo": "invalid_type"
    },
    {
      "campo": "itemId",
      "mensaje": "Invalid uuid",
      "codigo": "invalid_string"
    }
  ]
}
```

Status HTTP: `400 Bad Request`

---

## Patterns Comunes

### Schema Reutilizable

```typescript
// Schemas base
const UUIDSchema = z.string().uuid();
const CantidadPositivaSchema = z.number().int().positive();

// Composición
export const ReservarInventarioSchema = z.object({
  itemId: UUIDSchema,
  cantidad: CantidadPositivaSchema,
});
```

### Validaciones Condicionales

```typescript
export const AjustarInventarioSchema = z.object({
  cantidad: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: 'La cantidad no puede ser 0',
    }),
  empleadoId: z.string().uuid(),
});
```

### Opcional con Default

```typescript
export const BuscarProductosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
```

### Transformaciones

```typescript
export const CrearUsuarioSchema = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  nombre: z.string().trim().min(3),
});
```

---

## Migración desde class-validator

### Antes (class-validator)

```typescript
// DTO con decoradores
export class ReservarInventarioDto {
  @IsEnum(['PRODUCTO', 'PAQUETE'])
  tipoItem: string;

  @IsUUID()
  itemId: string;

  @IsNumber()
  @Min(1)
  cantidad: number;
}

// Controller
@Post()
async reservar(@Body() dto: ReservarInventarioDto) {
  // ...
}

// main.ts
app.useGlobalPipes(new ValidationPipe());
```

### Después (Zod)

```typescript
// Schema Zod
export const ReservarInventarioSchema = z.object({
  tipoItem: z.enum(['PRODUCTO', 'PAQUETE']),
  itemId: z.string().uuid(),
  cantidad: z.number().int().positive(),
});

export type ReservarInventarioDto = z.infer<typeof ReservarInventarioSchema>;

// Controller
@Post()
async reservar(
  @Body(new ZodValidationPipe(ReservarInventarioSchema))
  dto: ReservarInventarioDto,
) {
  // ...
}

// main.ts - NO necesita ValidationPipe global
```

---

## Testing

```typescript
import { ZodValidationPipe } from './zod-validation.pipe';
import { ReservarInventarioSchema } from './schemas';

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(ReservarInventarioSchema);
  });

  it('debe validar DTO correcto', () => {
    const validDto = {
      tipoItem: 'PRODUCTO',
      itemId: '550e8400-e29b-41d4-a716-446655440000',
      cantidad: 10,
    };

    const result = pipe.transform(validDto, { type: 'body' });
    expect(result).toEqual(validDto);
  });

  it('debe rechazar DTO inválido', () => {
    const invalidDto = {
      tipoItem: 'INVALIDO',
      itemId: 'not-a-uuid',
      cantidad: -5,
    };

    expect(() => pipe.transform(invalidDto, { type: 'body' })).toThrow(
      BadRequestException,
    );
  });
});
```

---

## Recursos

- [Zod Documentation](https://zod.dev)
- [Zod vs class-validator](https://github.com/colinhacks/zod#comparison)
- [NestJS Pipes](https://docs.nestjs.com/pipes)

---

**Última actualización:** Enero 2026
