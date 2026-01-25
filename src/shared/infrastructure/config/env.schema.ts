import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().refine(
    (val) => {
      try {
        const url = new URL(val);
        return url.protocol === 'postgresql:';
      } catch {
        return false;
      }
    },
    { message: 'DATABASE_URL debe ser una URL válida de PostgreSQL' },
  ),

  NODE_ENV: z
    .enum(['production', 'development'], {
      error: 'NODE_ENV debe ser "production" o "development"',
    })
    .default('development'),

  PORT: z.coerce
    .number({
      error: (issue) =>
        issue.input === undefined
          ? 'PORT es requerido'
          : 'PORT debe ser un número',
    })
    .int({ error: 'PORT debe ser un número entero' })
    .positive({ error: 'PORT debe ser positivo' })
    .default(3000),
});

export type EnvConfig = z.infer<typeof envSchema>;
