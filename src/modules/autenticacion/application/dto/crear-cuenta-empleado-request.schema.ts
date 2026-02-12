import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const crearCuentaEmpleadoRequestSchema = z.object({
  empleadoId: z.uuid({ error: 'ID de empleado inválido' }),
  email: z.email({ error: 'Email inválido' }),
  temporaryPassword: z
    .string()
    .min(8, { error: 'La contraseña debe tener al menos 8 caracteres' })
    .refine((val) => passwordRegex.test(val), {
      message:
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
    }),
});

export type CrearCuentaEmpleadoRequestDto = z.infer<
  typeof crearCuentaEmpleadoRequestSchema
>;
