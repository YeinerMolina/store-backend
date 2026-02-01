import { z } from 'zod';

export const consolidarReservaRequestSchema = z.object({
  operacionId: z.uuid({ error: 'operacionId debe ser un UUID válido' }),
});

export type ConsolidarReservaRequestDto = z.infer<
  typeof consolidarReservaRequestSchema
>;
