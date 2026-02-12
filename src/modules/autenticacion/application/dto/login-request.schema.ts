import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.email({ error: 'Email inválido' }),
  password: z.string().min(1, { error: 'La contraseña es requerida' }),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
