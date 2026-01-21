/**
 * VALIDACIONES COMUNES - ZOD SCHEMAS
 *
 * Schemas base reutilizables en todo el proyecto.
 * Estos schemas garantizan consistencia en validaciones cross-módulo.
 *
 * CONVENCIÓN:
 * - Nombres descriptivos y específicos
 * - Mensajes de error en español
 * - Exportar schemas Y tipos cuando aplique
 *
 * USO:
 * ```typescript
 * import { UUIDSchema, EmailSchema } from '@/shared/validation/common.schemas';
 *
 * const MiSchema = z.object({
 *   id: UUIDSchema,
 *   email: EmailSchema,
 * });
 * ```
 */

import { z } from 'zod';

// ============================================================================
// PRIMITIVOS
// ============================================================================

/**
 * String no vacío
 */
export const NonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, { message: 'No puede estar vacío' });

/**
 * String con longitud específica
 */
export const StringWithLength = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: `Mínimo ${min} caracteres` })
    .max(max, { message: `Máximo ${max} caracteres` });

/**
 * Número entero positivo
 */
export const PositiveIntSchema = z
  .number()
  .int({ message: 'Debe ser un número entero' })
  .positive({ message: 'Debe ser mayor a 0' });

/**
 * Número entero no negativo (>= 0)
 */
export const NonNegativeIntSchema = z
  .number()
  .int({ message: 'Debe ser un número entero' })
  .nonnegative({ message: 'No puede ser negativo' });

/**
 * Número decimal positivo con precisión específica
 * @param precision - Número de decimales (default: 2)
 */
export const DecimalSchema = (precision: number = 2) =>
  z
    .number()
    .positive({ message: 'Debe ser mayor a 0' })
    .refine(
      (val) => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= precision;
      },
      { message: `Máximo ${precision} decimales` },
    );

// ============================================================================
// IDENTIFICADORES
// ============================================================================

/**
 * UUID v4 válido
 */
export const UUIDSchema = z
  .string()
  .uuid({ message: 'Debe ser un UUID válido' });

/**
 * Lista de UUIDs
 */
export const UUIDArraySchema = z
  .array(UUIDSchema)
  .min(1, { message: 'Debe contener al menos un ID' });

// ============================================================================
// TEXTO
// ============================================================================

/**
 * Email válido
 */
export const EmailSchema = z
  .string()
  .email({ message: 'Email inválido' })
  .toLowerCase()
  .trim();

/**
 * URL válida
 */
export const URLSchema = z.string().url({ message: 'URL inválida' }).trim();

/**
 * Teléfono (formato flexible)
 * Acepta: +54 9 11 1234-5678, 11-1234-5678, 1112345678, etc.
 */
export const PhoneSchema = z
  .string()
  .trim()
  .min(7, { message: 'Teléfono muy corto' })
  .max(20, { message: 'Teléfono muy largo' })
  .regex(/^[\d\s\-\+\(\)]+$/, {
    message: 'Solo números, espacios, guiones, + y paréntesis',
  });

/**
 * Nombre de persona (2-100 caracteres, solo letras y espacios)
 */
export const PersonNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Mínimo 2 caracteres' })
  .max(100, { message: 'Máximo 100 caracteres' })
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'Solo letras y espacios',
  });

/**
 * Slug (para URLs amigables)
 */
export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones',
  });

// ============================================================================
// FECHAS
// ============================================================================

/**
 * Fecha ISO 8601
 */
export const DateISOSchema = z
  .string()
  .datetime({ message: 'Debe ser una fecha ISO 8601 válida' });

/**
 * Fecha futura
 */
export const FutureDateSchema = z
  .string()
  .datetime()
  .refine((date) => new Date(date) > new Date(), {
    message: 'Debe ser una fecha futura',
  });

/**
 * Fecha pasada
 */
export const PastDateSchema = z
  .string()
  .datetime()
  .refine((date) => new Date(date) < new Date(), {
    message: 'Debe ser una fecha pasada',
  });

/**
 * Rango de fechas
 */
export const DateRangeSchema = z
  .object({
    desde: DateISOSchema,
    hasta: DateISOSchema,
  })
  .refine((data) => new Date(data.desde) <= new Date(data.hasta), {
    message: 'La fecha "desde" debe ser anterior a "hasta"',
    path: ['hasta'],
  });

// ============================================================================
// PAGINACIÓN
// ============================================================================

/**
 * Número de página (>= 1)
 */
export const PageNumberSchema = z.coerce.number().int().positive().default(1);

/**
 * Límite de resultados (1-100)
 */
export const PageLimitSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(100, { message: 'Máximo 100 resultados por página' })
  .default(10);

/**
 * Schema completo de paginación
 */
export const PaginationSchema = z.object({
  page: PageNumberSchema,
  limit: PageLimitSchema,
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

// ============================================================================
// ORDENAMIENTO
// ============================================================================

/**
 * Dirección de ordenamiento
 */
export const SortDirectionSchema = z
  .enum(['asc', 'desc'], {
    message: 'Debe ser "asc" o "desc"',
  })
  .default('asc');

/**
 * Schema de ordenamiento genérico
 * @param allowedFields - Campos permitidos para ordenar
 */
export const SortSchema = <T extends string>(
  allowedFields: readonly [T, ...T[]],
) =>
  z.object({
    sortBy: z.enum(allowedFields).optional(),
    sortDirection: SortDirectionSchema,
  });

// ============================================================================
// DOCUMENTOS ARGENTINOS
// ============================================================================

/**
 * DNI argentino (7-8 dígitos)
 */
export const DNISchema = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, {
    message: 'DNI debe tener 7 u 8 dígitos',
  });

/**
 * CUIT/CUIL argentino (formato: 20-12345678-9)
 */
export const CUITSchema = z
  .string()
  .trim()
  .regex(/^\d{2}-\d{8}-\d$/, {
    message: 'Formato inválido (debe ser XX-XXXXXXXX-X)',
  });

// ============================================================================
// MONEDA
// ============================================================================

/**
 * Código de moneda ISO 4217
 */
export const CurrencyCodeSchema = z
  .enum(['ARS', 'USD', 'EUR', 'BRL'], {
    message: 'Moneda no soportada',
  })
  .default('ARS');

/**
 * Monto monetario (2 decimales, >= 0)
 */
export const MoneyAmountSchema = DecimalSchema(2).refine((val) => val >= 0, {
  message: 'El monto no puede ser negativo',
});

/**
 * Objeto de dinero completo
 */
export const MoneySchema = z.object({
  amount: MoneyAmountSchema,
  currency: CurrencyCodeSchema,
});

export type MoneyDto = z.infer<typeof MoneySchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Crear enum schema con mensaje customizado
 */
export const createEnumSchema = <T extends string>(
  values: readonly [T, ...T[]],
  entityName: string,
) =>
  z.enum(values, {
    message: `${entityName} inválido. Valores permitidos: ${values.join(', ')}`,
  });
