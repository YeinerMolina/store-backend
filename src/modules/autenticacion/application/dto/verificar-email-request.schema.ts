import { z } from 'zod';

export const verificarEmailRequestSchema = z.object({
  token: z.uuid({ error: 'Token inválido' }),
});

export type VerificarEmailRequestDto = z.infer<
  typeof verificarEmailRequestSchema
>;
