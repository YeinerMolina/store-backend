/**
 * Usar Symbols en lugar de strings para evitar colisiones de nombres entre módulos.
 */

export const AUTENTICACION_SERVICE_TOKEN = Symbol('AUTENTICACION_SERVICE');
export const CUENTA_USUARIO_REPOSITORY_TOKEN = Symbol(
  'CUENTA_USUARIO_REPOSITORY',
);
export const SESION_USUARIO_REPOSITORY_TOKEN = Symbol(
  'SESION_USUARIO_REPOSITORY',
);
export const TOKEN_RECUPERACION_REPOSITORY_TOKEN = Symbol(
  'TOKEN_RECUPERACION_REPOSITORY',
);
export const PASSWORD_HASHER_TOKEN = Symbol('PASSWORD_HASHER');
export const TOKEN_GENERATOR_TOKEN = Symbol('TOKEN_GENERATOR');
export const JWT_SERVICE_TOKEN = Symbol('JWT_SERVICE');
export const EMAIL_SERVICE_TOKEN = Symbol('EMAIL_SERVICE');
export const CLIENTE_PORT_TOKEN = Symbol('CLIENTE_PORT');
export const EMPLEADO_PORT_TOKEN = Symbol('EMPLEADO_PORT');
export const EVENT_BUS_TOKEN = Symbol('EVENT_BUS');
export const TRANSACTION_MANAGER_TOKEN = Symbol('TRANSACTION_MANAGER');
export const CONFIGURACION_PORT_TOKEN = Symbol('CONFIGURACION_PORT');
