import { z } from 'zod';

export const solicitarRecuperacionRequestSchema = z.object({
  email: z.email({ error: 'Email inválido' }),
});

export type SolicitarRecuperacionRequestDto = z.infer<
  typeof solicitarRecuperacionRequestSchema
>;
