import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const cambiarPasswordRequestSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { error: 'La contraseña actual es requerida' }),
  newPassword: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
    .refine((val) => passwordRegex.test(val), {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
  revocarOtrasSesiones: z.boolean().optional(),
});

export type CambiarPasswordRequestDto = z.infer<
  typeof cambiarPasswordRequestSchema
>;
