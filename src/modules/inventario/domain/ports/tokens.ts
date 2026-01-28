/**
 * Tokens de inyección de dependencias para el módulo INVENTARIO.
 * Usamos Symbols para type-safety y evitar colisiones.
 */

export const INVENTARIO_SERVICE_TOKEN = Symbol('INVENTARIO_SERVICE');

export const INVENTARIO_REPOSITORY_TOKEN = Symbol('INVENTARIO_REPOSITORY');

export const EVENT_BUS_PORT_TOKEN = Symbol('EVENT_BUS_PORT');
export const EMPLEADO_PORT_TOKEN = Symbol('EMPLEADO_PORT');
export const PRODUCTO_PORT_TOKEN = Symbol('PRODUCTO_PORT');
