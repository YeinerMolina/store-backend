import type {
  CrearInventarioConCantidadProps,
  ReservarInventarioCommand,
  ConsolidarReservaProps,
  AjustarInventarioCommand,
  ConsultarDisponibilidadProps,
  EliminarInventarioProps,
  InventarioResponse,
  ReservaResponse,
  DisponibilidadResponse,
} from '../../aggregates/inventario/inventario.types';
import { INVENTARIO_SERVICE_TOKEN } from '../tokens';

export { INVENTARIO_SERVICE_TOKEN };

/**
 * Puerto inbound para el módulo INVENTARIO.
 * Define casos de uso usando Commands/Props del dominio (no DTOs de application).
 *
 * Decisión arquitectónica: Este puerto usa tipos del DOMINIO, permitiendo que
 * la lógica de negocio sea independiente de HTTP/GraphQL/gRPC. El Application Service
 * mapea DTOs → Commands del dominio antes de llamar estos métodos.
 */
export interface InventarioService {
  /**
   * @throws EntidadDuplicadaError
   * @throws PermisoInsuficienteError
   */
  crearInventario(
    props: CrearInventarioConCantidadProps,
  ): Promise<InventarioResponse>;

  /**
   * @throws EntidadNoEncontradaError
   * @throws StockInsuficienteError
   * @throws OptimisticLockingError
   */
  reservarInventario(
    command: ReservarInventarioCommand,
  ): Promise<ReservaResponse>;

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
  ): Promise<InventarioResponse>;

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
