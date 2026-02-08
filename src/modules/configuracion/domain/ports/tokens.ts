/**
 * Dependency injection tokens for CONFIGURACION module.
 * Located in domain because tokens are part of the domain contract,
 * not infrastructure implementation details.
 */

export const CONFIGURACION_SERVICE_TOKEN = Symbol('CONFIGURACION_SERVICE');
export const CONFIGURACION_REPOSITORY_TOKEN = Symbol(
  'CONFIGURACION_REPOSITORY',
);
