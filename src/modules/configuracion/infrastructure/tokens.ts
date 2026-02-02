/**
 * Dependency Injection Tokens - CONFIGURACIÓN Module
 *
 * Symbol-based tokens for NestJS module provider registration.
 * Prevents string key collisions across modules.
 */

export const CONFIGURACION_SERVICE_TOKEN = Symbol('CONFIGURACION_SERVICE');
export const CONFIGURACION_REPOSITORY_TOKEN = Symbol(
  'CONFIGURACION_REPOSITORY',
);
