import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const ejecutarRecuperacionRequestSchema = z.object({
  token: z.uuid({ error: 'Token inválido' }),
  newPassword: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
    .refine((val) => passwordRegex.test(val), {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
});

export type EjecutarRecuperacionRequestDto = z.infer<
  typeof ejecutarRecuperacionRequestSchema
>;
