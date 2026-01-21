/**
 * Tokens de inyección de dependencias para el módulo INVENTARIO
 *
 * Usamos Symbols en lugar de strings para:
 * - Type-safety en tiempo de compilación
 * - Evitar colisiones de nombres
 * - Mejor soporte para refactoring
 */

// ============================================================================
// PUERTOS INBOUND (Casos de Uso)
// ============================================================================

/**
 * Token para el servicio principal de inventario
 * Implementado por: InventarioApplicationService
 */
export const INVENTARIO_SERVICE_TOKEN = Symbol('INVENTARIO_SERVICE');

// ============================================================================
// PUERTOS OUTBOUND (Repositorios)
// ============================================================================

/**
 * Token para el repositorio de Inventario
 * Implementado por: InventarioPostgresRepository
 */
export const INVENTARIO_REPOSITORY_TOKEN = Symbol('INVENTARIO_REPOSITORY');

/**
 * Token para el repositorio de Reserva
 * Implementado por: ReservaPostgresRepository
 */
export const RESERVA_REPOSITORY_TOKEN = Symbol('RESERVA_REPOSITORY');

/**
 * Token para el repositorio de MovimientoInventario
 * Implementado por: MovimientoInventarioPostgresRepository
 */
export const MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN = Symbol(
  'MOVIMIENTO_INVENTARIO_REPOSITORY',
);

// ============================================================================
// PUERTOS OUTBOUND (Servicios Externos)
// ============================================================================

/**
 * Token para el bus de eventos
 * Implementado por: EventBusConsoleAdapter (desarrollo), EventBusRedisAdapter (producción)
 */
export const EVENT_BUS_PORT_TOKEN = Symbol('EVENT_BUS_PORT');

/**
 * Token para el puerto de Empleado (cuando módulo IDENTIDAD esté disponible)
 * Implementado por: EmpleadoHttpAdapter
 */
export const EMPLEADO_PORT_TOKEN = Symbol('EMPLEADO_PORT');

/**
 * Token para el puerto de Producto (cuando módulo CATALOGO esté disponible)
 * Implementado por: ProductoHttpAdapter
 */
export const PRODUCTO_PORT_TOKEN = Symbol('PRODUCTO_PORT');
