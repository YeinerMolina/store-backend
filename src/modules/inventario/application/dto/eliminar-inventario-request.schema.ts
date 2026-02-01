import { z } from 'zod';

export const eliminarInventarioRequestSchema = z.object({
  inventarioId: z.uuid({ error: 'inventarioId debe ser un UUID válido' }),
});

export type EliminarInventarioRequestDto = z.infer<
  typeof eliminarInventarioRequestSchema
>;
