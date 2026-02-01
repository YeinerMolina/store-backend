import { z } from 'zod';

export const ajustarInventarioRequestSchema = z.object({
  inventarioId: z.uuid({ error: 'inventarioId debe ser un UUID válido' }),
  cantidad: z
    .number({ error: 'cantidad debe ser un número' })
    .int({ error: 'cantidad debe ser un número entero' })
    .refine((val) => val !== 0, {
      message: 'cantidad no puede ser 0 (usa valor positivo o negativo)',
    }),
  empleadoId: z.uuid({ error: 'empleadoId debe ser un UUID válido' }),
  intencion: z.string().min(1).max(200).optional(),
  notas: z.string().max(500).optional(),
});

export type AjustarInventarioRequestDto = z.infer<
  typeof ajustarInventarioRequestSchema
>;
