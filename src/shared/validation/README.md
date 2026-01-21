# Validaciones Comunes - Zod Schemas

Librería centralizada de schemas de validación reutilizables para todo el proyecto.

---

## 📚 Índice

- [Primitivos](#primitivos)
- [Identificadores](#identificadores)
- [Texto](#texto)
- [Fechas](#fechas)
- [Paginación](#paginación)
- [Ordenamiento](#ordenamiento)
- [Documentos Argentinos](#documentos-argentinos)
- [Moneda](#moneda)
- [Helpers](#helpers)

---

## 🎯 Propósito

**PROBLEMA:** Cada módulo define sus propias validaciones, causando:

- Duplicación de código
- Inconsistencias (ej: UUID validado diferente en cada módulo)
- Dificultad para mantener/actualizar validaciones

**SOLUCIÓN:** Schemas comunes centralizados que garantizan consistencia cross-módulo.

---

## 🚀 Uso

### Importar Schemas

```typescript
// Opción 1: Import específico
import { UUIDSchema, EmailSchema } from '@/shared/validation/common.schemas';

// Opción 2: Import desde barrel
import { UUIDSchema, EmailSchema } from '@/shared/validation';
```

### Usar en tu Schema

```typescript
import { z } from 'zod';
import { UUIDSchema, PositiveIntSchema } from '@/shared/validation';

export const ReservarProductoSchema = z.object({
  productoId: UUIDSchema, // ← Reutilizado
  cantidad: PositiveIntSchema, // ← Reutilizado
  clienteId: UUIDSchema, // ← Reutilizado
});
```

---

## 📋 Schemas Disponibles

### Primitivos

| Schema                       | Tipo     | Validación            | Ejemplo                                     |
| ---------------------------- | -------- | --------------------- | ------------------------------------------- |
| `NonEmptyStringSchema`       | `string` | No vacío, trim        | `"Hola"` ✅ `""` ❌                         |
| `StringWithLength(min, max)` | `string` | Longitud específica   | `StringWithLength(3, 50)`                   |
| `PositiveIntSchema`          | `number` | Entero > 0            | `5` ✅ `0` ❌ `-1` ❌                       |
| `NonNegativeIntSchema`       | `number` | Entero >= 0           | `0` ✅ `5` ✅ `-1` ❌                       |
| `DecimalSchema(precision)`   | `number` | Decimal con precisión | `DecimalSchema(2)` → `12.34` ✅ `12.345` ❌ |

### Identificadores

| Schema            | Validación             | Ejemplo                                     |
| ----------------- | ---------------------- | ------------------------------------------- |
| `UUIDSchema`      | UUID v4 válido         | `"550e8400-e29b-41d4-a716-446655440000"` ✅ |
| `UUIDArraySchema` | Array de UUIDs (min 1) | `[uuid1, uuid2]` ✅                         |

### Texto

| Schema             | Validación                         | Uso                                |
| ------------------ | ---------------------------------- | ---------------------------------- |
| `EmailSchema`      | Email válido, lowercase            | Emails de usuarios                 |
| `URLSchema`        | URL válida                         | Links, webhooks                    |
| `PhoneSchema`      | Teléfono flexible                  | `+54 9 11 1234-5678`, `1112345678` |
| `PersonNameSchema` | Nombre persona (letras + espacios) | Nombres, apellidos                 |
| `SlugSchema`       | URL-friendly                       | `mi-producto-slug`                 |

### Fechas

| Schema             | Validación        | Ejemplo                  |
| ------------------ | ----------------- | ------------------------ |
| `DateISOSchema`    | ISO 8601          | `"2026-01-21T20:00:00Z"` |
| `FutureDateSchema` | Fecha futura      | Vencimientos, expiración |
| `PastDateSchema`   | Fecha pasada      | Fechas de nacimiento     |
| `DateRangeSchema`  | Rango desde-hasta | Filtros de búsqueda      |

### Paginación

| Schema             | Default                | Rango | Uso                   |
| ------------------ | ---------------------- | ----- | --------------------- |
| `PageNumberSchema` | `1`                    | >= 1  | Número de página      |
| `PageLimitSchema`  | `10`                   | 1-100 | Resultados por página |
| `PaginationSchema` | `{page: 1, limit: 10}` | -     | Objeto completo       |

**Tipo inferido:**

```typescript
type PaginationDto = z.infer<typeof PaginationSchema>;
// { page: number; limit: number; }
```

### Ordenamiento

| Schema                | Default | Ejemplo           |
| --------------------- | ------- | ----------------- |
| `SortDirectionSchema` | `'asc'` | `'asc' \| 'desc'` |
| `SortSchema(fields)`  | -       | Ver ejemplo abajo |

**Ejemplo SortSchema:**

```typescript
const ProductoSortSchema = SortSchema(['nombre', 'precio', 'fecha'] as const);

// Tipo inferido:
// {
//   sortBy?: 'nombre' | 'precio' | 'fecha';
//   sortDirection: 'asc' | 'desc';
// }
```

### Documentos Argentinos

| Schema       | Formato       | Ejemplo           |
| ------------ | ------------- | ----------------- |
| `DNISchema`  | 7-8 dígitos   | `"12345678"`      |
| `CUITSchema` | XX-XXXXXXXX-X | `"20-12345678-9"` |

### Moneda

| Schema               | Descripción                   | Tipo                 |
| -------------------- | ----------------------------- | -------------------- |
| `CurrencyCodeSchema` | ISO 4217 (ARS, USD, EUR, BRL) | `enum`               |
| `MoneyAmountSchema`  | Monto >= 0, 2 decimales       | `number`             |
| `MoneySchema`        | Objeto completo               | `{amount, currency}` |

**Tipo inferido:**

```typescript
type MoneyDto = z.infer<typeof MoneySchema>;
// { amount: number; currency: 'ARS' | 'USD' | 'EUR' | 'BRL'; }
```

---

## 🛠️ Helpers

### createEnumSchema

Crea un enum schema con mensaje personalizado:

```typescript
const TipoProductoSchema = createEnumSchema(
  ['SIMPLE', 'VARIABLE', 'DIGITAL'] as const,
  'Tipo de producto',
);

// Error message: "Tipo de producto inválido. Valores permitidos: SIMPLE, VARIABLE, DIGITAL"
```

---

## 📝 Ejemplos Completos

### Caso 1: Validar Request de API

```typescript
import { z } from 'zod';
import {
  UUIDSchema,
  PositiveIntSchema,
  EmailSchema,
} from '@/shared/validation';

export const CrearPedidoSchema = z.object({
  clienteId: UUIDSchema,
  email: EmailSchema,
  items: z
    .array(
      z.object({
        productoId: UUIDSchema,
        cantidad: PositiveIntSchema,
      }),
    )
    .min(1),
});

export type CrearPedidoDto = z.infer<typeof CrearPedidoSchema>;
```

### Caso 2: Paginación con Ordenamiento

```typescript
import { PaginationSchema, SortSchema } from '@/shared/validation';

const ListarProductosSchema = PaginationSchema.merge(
  SortSchema(['nombre', 'precio', 'stock'] as const),
);

// Tipo inferido:
// {
//   page: number;
//   limit: number;
//   sortBy?: 'nombre' | 'precio' | 'stock';
//   sortDirection: 'asc' | 'desc';
// }
```

### Caso 3: Formulario de Usuario

```typescript
import {
  EmailSchema,
  PersonNameSchema,
  PhoneSchema,
  DNISchema,
} from '@/shared/validation';

export const RegistroUsuarioSchema = z.object({
  email: EmailSchema,
  nombre: PersonNameSchema,
  apellido: PersonNameSchema,
  telefono: PhoneSchema.optional(),
  dni: DNISchema,
  password: StringWithLength(8, 100),
});
```

---

## 🎨 Composición de Schemas

Los schemas se pueden componer para crear validaciones complejas:

```typescript
import { UUIDSchema, MoneySchema, DateRangeSchema } from '@/shared/validation';

const ReporteVentasSchema = z.object({
  sucursalId: UUIDSchema.optional(),
  total: MoneySchema,
  periodo: DateRangeSchema,
  vendedorIds: UUIDArraySchema.optional(),
});
```

---

## 🔧 Extender Schemas Comunes

Si necesitás una validación más específica:

```typescript
import { UUIDSchema } from '@/shared/validation';

// Agregar validación custom
const ProductoIdSchema = UUIDSchema.refine(
  async (id) => await productoExiste(id),
  { message: 'El producto no existe' },
);
```

---

## 🚨 Buenas Prácticas

### ✅ DO

```typescript
// Reutilizar schemas comunes
const schema = z.object({
  id: UUIDSchema,
  cantidad: PositiveIntSchema,
});
```

```typescript
// Componer schemas
const schema = PaginationSchema.merge(z.object({ categoria: z.string() }));
```

```typescript
// Usar helpers
const TipoSchema = createEnumSchema(['A', 'B', 'C'] as const, 'Tipo');
```

### ❌ DON'T

```typescript
// Duplicar validaciones en cada módulo
const schema = z.object({
  id: z.string().uuid(), // ❌ Usar UUIDSchema
  cantidad: z.number().int().positive(), // ❌ Usar PositiveIntSchema
});
```

```typescript
// Hardcodear mensajes inconsistentes
const schema = z.object({
  id: z.string().uuid({ message: 'ID inválido' }), // ❌ Mensaje diferente
});
```

---

## 🧪 Testing

```typescript
import { UUIDSchema, PositiveIntSchema } from '@/shared/validation';

describe('Common Schemas', () => {
  it('UUIDSchema acepta UUID válido', () => {
    const result = UUIDSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
  });

  it('UUIDSchema rechaza string inválido', () => {
    const result = UUIDSchema.safeParse('invalid-uuid');
    expect(result.success).toBe(false);
  });

  it('PositiveIntSchema rechaza 0', () => {
    const result = PositiveIntSchema.safeParse(0);
    expect(result.success).toBe(false);
  });
});
```

---

## 📚 Recursos

- [Zod Documentation](https://zod.dev)
- [Zod Coercion](https://zod.dev/?id=coercion-for-primitives)
- [Zod Composition](https://zod.dev/?id=merging)
- `src/shared/pipes/README.md` - Uso con ZodValidationPipe

---

## 🔄 Agregar Nuevos Schemas

1. **Editar** `common.schemas.ts`
2. **Documentar** en este README
3. **Exportar** en `index.ts` (si no está usando export \*)
4. **Testear** con casos válidos e inválidos

**Ejemplo:**

```typescript
// En common.schemas.ts
export const CodigoPostalSchema = z
  .string()
  .regex(/^\d{4}$/, { message: 'Código postal debe tener 4 dígitos' });

// Actualizar README con tabla y ejemplo
```

---

**Última actualización:** Enero 2026  
**Autor:** Store Backend Team
