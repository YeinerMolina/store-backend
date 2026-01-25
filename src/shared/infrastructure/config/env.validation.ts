import { z } from 'zod';
import { envSchema, type EnvConfig } from './env.schema';

/**
 * Valida variables de entorno para ConfigModule.forRoot().
 * Se ejecuta durante la inicialización de NestJS.
 * @throws Error si la validación falla, previniendo arranque de la app
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = z.treeifyError(result.error);

    console.error('❌ Variables de entorno inválidas:');
    console.error(JSON.stringify(formattedErrors, null, 2));

    throw new Error(
      `Validación de configuración falló: ${result.error.message}`,
    );
  }

  /**
   * Sobrescribe process.env con valores validados/parseados.
   * Garantiza que helpers sin DI (isProduction, getPort) funcionen.
   */
  Object.assign(process.env, result.data);

  return result.data;
}
