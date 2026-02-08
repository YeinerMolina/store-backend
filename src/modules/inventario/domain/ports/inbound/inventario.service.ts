import type {
  CrearInventarioConCantidadProps,
  ReservarInventarioCommand,
  ConsolidarReservaProps,
  AjustarInventarioCommand,
  ConsultarDisponibilidadProps,
  EliminarInventarioProps,
  DisponibilidadResponse,
} from '../../aggregates/inventario/inventario.types';
import type { Inventario } from '../../aggregates/inventario/inventario.entity';
import type { Reserva } from '../../aggregates/inventario/reserva.entity';
import { INVENTARIO_SERVICE_TOKEN } from '../tokens';

export { INVENTARIO_SERVICE_TOKEN };

/**
 * Puerto inbound para el módulo INVENTARIO.
 * Define casos de uso usando Commands/Props del dominio (no DTOs de application).
 *
 * Decisión arquitectónica: Este puerto devuelve AGREGADOS del dominio,
 * manteniendo la capa de aplicación independiente de detalles de infraestructura.
 * Los controllers (infrastructure) son responsables de mapear agregados → DTOs HTTP.
 */
export interface InventarioService {
  /**
   * @throws EntidadDuplicadaError
   * @throws PermisoInsuficienteError
   */
  crearInventario(props: CrearInventarioConCantidadProps): Promise<Inventario>;

  /**
   * @throws EntidadNoEncontradaError
   * @throws StockInsuficienteError
   * @throws OptimisticLockingError
   */
  reservarInventario(command: ReservarInventarioCommand): Promise<Reserva>;

  /**
   * @throws EntidadNoEncontradaError
   * @throws EstadoInvalidoError
   */
  consolidarReserva(props: ConsolidarReservaProps): Promise<void>;

  liberarReservasExpiradas(): Promise<void>;

  /**
   * @throws EntidadNoEncontradaError
   * @throws PermisoInsuficienteError
   * @throws StockInsuficienteError
   */
  ajustarInventario(command: AjustarInventarioCommand): Promise<void>;

  consultarDisponibilidad(
    props: ConsultarDisponibilidadProps,
  ): Promise<DisponibilidadResponse>;

  /**
   * @throws EntidadNoEncontradaError
   */
  obtenerInventarioPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<Inventario>;

  detectarStockBajo(): Promise<void>;

  /**
   * Elimina inventario si no tiene dependencias (reservas, movimientos o items)
   * La eliminación es lógica (soft delete)
   *
   * @throws EntidadNoEncontradaError
   * @throws InventarioConDependenciasError
   * @throws OptimisticLockingError
   */
  eliminarInventario(props: EliminarInventarioProps): Promise<void>;

  /**
   * Restaura inventario soft-deleted.
   *
   * @throws EntidadNoEncontradaError
   * @throws EstadoInvalidoError
   */
  restaurarInventario(inventarioId: string): Promise<void>;
}
