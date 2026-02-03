import { z } from 'zod';

export const CrearParametroOperativoSchema = z.object({
  clave: z
    .string({ error: 'Clave debe ser string' })
    .min(3, { error: 'Clave debe tener mínimo 3 caracteres' })
    .max(50, { error: 'Clave no puede exceder 50 caracteres' })
    .regex(/^[A-Z_]+$/, {
      error:
        'Clave debe contener solo MAYÚSCULAS y guiones bajos (ej: DURACION_RESERVA_VENTA)',
    }),

  nombre: z
    .string({ error: 'Nombre debe ser string' })
    .min(3, { error: 'Nombre debe tener mínimo 3 caracteres' })
    .max(100, { error: 'Nombre no puede exceder 100 caracteres' }),

  descripcion: z.string({ error: 'Descripción debe ser string' }).optional(),

  tipoDato: z.enum(['ENTERO', 'DECIMAL', 'BOOLEAN', 'TEXTO', 'DURACION'], {
    error: 'Tipo de dato debe ser: ENTERO, DECIMAL, BOOLEAN, TEXTO, DURACION',
  }),

  valor: z
    .string({ error: 'Valor debe ser string' })
    .min(1, { error: 'Valor no puede estar vacío' })
    .max(500, { error: 'Valor no puede exceder 500 caracteres' }),

  valorDefecto: z
    .string({ error: 'Valor defecto debe ser string' })
    .min(1, { error: 'Valor defecto no puede estar vacío' })
    .max(500, { error: 'Valor defecto no puede exceder 500 caracteres' }),

  valorMinimo: z.string({ error: 'Valor mínimo debe ser string' }).optional(),

  valorMaximo: z.string({ error: 'Valor máximo debe ser string' }).optional(),

  requiereReinicio: z
    .boolean({ error: 'Requiere reinicio debe ser boolean' })
    .optional()
    .default(false),
});

export type CrearParametroOperativoSchemaType = z.infer<
  typeof CrearParametroOperativoSchema
>;

export const ActualizarParametroOperativoSchema = z.object({
  valor: z
    .string({ error: 'Valor debe ser string' })
    .min(1, { error: 'Valor no puede estar vacío' })
    .max(500, { error: 'Valor no puede exceder 500 caracteres' }),
});

export type ActualizarParametroOperativoSchemaType = z.infer<
  typeof ActualizarParametroOperativoSchema
>;

export const CrearPoliticaSchema = z.object({
  tipo: z.enum(['CAMBIOS', 'ENVIOS', 'TERMINOS'], {
    error: 'Tipo debe ser: CAMBIOS, ENVIOS, TERMINOS',
  }),

  version: z
    .string({ error: 'Versión debe ser string' })
    .regex(/^\d+\.\d+\.\d+$/, {
      error: 'Versión debe tener formato semántico (ej: 1.0.0, 2.1.5)',
    }),

  contenido: z
    .string({ error: 'Contenido debe ser string' })
    .min(10, { error: 'Contenido debe tener mínimo 10 caracteres' })
    .max(10000, { error: 'Contenido no puede exceder 10000 caracteres' }),
});

export type CrearPoliticaSchemaType = z.infer<typeof CrearPoliticaSchema>;

export const PublicarPoliticaSchema = z.object({
  fechaVigenciaDesde: z.coerce
    .date({ error: 'Fecha vigencia debe ser un ISO string válido' })
    .optional(),
});

export type PublicarPoliticaSchemaType = z.infer<typeof PublicarPoliticaSchema>;
