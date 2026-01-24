/**
 * Schemas de validación comunes reutilizables en todo el proyecto.
 */

import { z } from 'zod';

export const NonEmptyStringSchema = z
  .string()
  .trim()
  .min(1, { message: 'No puede estar vacío' });

export const StringWithLength = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: `Mínimo ${min} caracteres` })
    .max(max, { message: `Máximo ${max} caracteres` });

export const PositiveIntSchema = z
  .number()
  .int({ message: 'Debe ser un número entero' })
  .positive({ message: 'Debe ser mayor a 0' });

export const NonNegativeIntSchema = z
  .number()
  .int({ message: 'Debe ser un número entero' })
  .nonnegative({ message: 'No puede ser negativo' });

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

export const UUIDSchema = z.uuid({ message: 'Debe ser un UUID válido' });

export const UUIDArraySchema = z
  .array(UUIDSchema)
  .min(1, { message: 'Debe contener al menos un ID' });

export const EmailSchema = z
  .email({ message: 'Email inválido' })
  .trim()
  .toLowerCase();

export const URLSchema = z.url({ message: 'URL inválida' }).trim();

export const PhoneSchema = z
  .string()
  .trim()
  .min(7, { message: 'Teléfono muy corto' })
  .max(20, { message: 'Teléfono muy largo' })
  .regex(/^[\d\s\-\+\(\)]+$/, {
    message: 'Solo números, espacios, guiones, + y paréntesis',
  });

export const PersonNameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Mínimo 2 caracteres' })
  .max(100, { message: 'Máximo 100 caracteres' })
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'Solo letras y espacios',
  });

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Solo minúsculas, números y guiones',
  });

export const DateISOSchema = z.iso.datetime({
  message: 'Debe ser una fecha ISO 8601 válida',
});

export const FutureDateSchema = z.iso
  .datetime()
  .refine((date) => new Date(date) > new Date(), {
    message: 'Debe ser una fecha futura',
  });

export const PastDateSchema = z.iso
  .datetime()
  .refine((date) => new Date(date) < new Date(), {
    message: 'Debe ser una fecha pasada',
  });

export const DateRangeSchema = z
  .object({
    desde: DateISOSchema,
    hasta: DateISOSchema,
  })
  .refine((data) => new Date(data.desde) <= new Date(data.hasta), {
    message: 'La fecha "desde" debe ser anterior a "hasta"',
    path: ['hasta'],
  });

export const PageNumberSchema = z.coerce.number().int().positive().default(1);

export const PageLimitSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(100, { message: 'Máximo 100 resultados por página' })
  .default(10);

export const PaginationSchema = z.object({
  page: PageNumberSchema,
  limit: PageLimitSchema,
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

export const SortDirectionSchema = z
  .enum(['asc', 'desc'], {
    message: 'Debe ser "asc" o "desc"',
  })
  .default('asc');

export const SortSchema = <T extends string>(
  allowedFields: readonly [T, ...T[]],
) =>
  z.object({
    sortBy: z.enum(allowedFields).optional(),
    sortDirection: SortDirectionSchema,
  });

export const DNISchema = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, {
    message: 'DNI debe tener 7 u 8 dígitos',
  });

export const CUITSchema = z
  .string()
  .trim()
  .regex(/^\d{2}-\d{8}-\d$/, {
    message: 'Formato inválido (debe ser XX-XXXXXXXX-X)',
  });

export const CurrencyCodeSchema = z
  .enum(['ARS', 'USD', 'EUR', 'BRL'], {
    message: 'Moneda no soportada',
  })
  .default('ARS');

export const MoneyAmountSchema = DecimalSchema(2).refine((val) => val >= 0, {
  message: 'El monto no puede ser negativo',
});

export const MoneySchema = z.object({
  amount: MoneyAmountSchema,
  currency: CurrencyCodeSchema,
});

export type MoneyDto = z.infer<typeof MoneySchema>;

export const createEnumSchema = <T extends string>(
  values: readonly [T, ...T[]],
  entityName: string,
) =>
  z.enum(values, {
    message: `${entityName} inválido. Valores permitidos: ${values.join(', ')}`,
  });
