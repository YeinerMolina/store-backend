import { z } from 'zod';

/**
 * Validación de contraseña:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula, una minúscula, un número
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const registrarClienteRequestSchema = z.object({
  email: z.email({ error: 'Email inválido' }),
  password: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
    .refine((val) => passwordRegex.test(val), {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
  nombre: z.string().min(1, { error: 'El nombre es requerido' }).max(100),
  apellido: z.string().min(1, { error: 'El apellido es requerido' }).max(100),
  telefono: z.string().max(20).optional(),
});

export type RegistrarClienteRequestDto = z.infer<
  typeof registrarClienteRequestSchema
>;
