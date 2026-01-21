import type { ReservarInventarioRequestDto } from '../../../application/dto/reservar-inventario-request.dto';
import type { ConsolidarReservaRequestDto } from '../../../application/dto/consolidar-reserva-request.dto';
import type { AjustarInventarioRequestDto } from '../../../application/dto/ajustar-inventario-request.dto';
import type { ConsultarDisponibilidadRequestDto } from '../../../application/dto/consultar-disponibilidad-request.dto';
import type { ReservaResponseDto } from '../../../application/dto/reserva-response.dto';
import type { DisponibilidadResponseDto } from '../../../application/dto/disponibilidad-response.dto';
import type { InventarioResponseDto } from '../../../application/dto/inventario-response.dto';
import { INVENTARIO_SERVICE_TOKEN } from '../tokens';

// Re-exportar token para conveniencia
export { INVENTARIO_SERVICE_TOKEN };

/**
 * Puerto de entrada (Inbound) del módulo INVENTARIO
 * Define los casos de uso disponibles
 */
export interface InventarioService {
  /**
   * Reserva stock para una venta o cambio
   * @throws StockInsuficienteError si no hay disponibilidad
   * @throws OptimisticLockingError si hay conflicto de concurrencia
   */
  reservarInventario(
    request: ReservarInventarioRequestDto,
  ): Promise<ReservaResponseDto>;

  /**
   * Consolida una reserva cuando la venta/cambio se completa exitosamente
   * @throws EntidadNoEncontradaError si la reserva no existe
   * @throws EstadoInvalidoError si la reserva no está ACTIVA
   */
  consolidarReserva(request: ConsolidarReservaRequestDto): Promise<void>;

  /**
   * Job que libera reservas expiradas (ejecutar cada minuto)
   */
  liberarReservasExpiradas(): Promise<void>;

  /**
   * Ajuste manual de inventario por un empleado
   * @throws EntidadNoEncontradaError si el inventario no existe
   * @throws PermisoInsuficienteError si el empleado no tiene permisos
   */
  ajustarInventario(request: AjustarInventarioRequestDto): Promise<void>;

  /**
   * Consulta si hay disponibilidad de un producto/paquete
   */
  consultarDisponibilidad(
    request: ConsultarDisponibilidadRequestDto,
  ): Promise<DisponibilidadResponseDto>;

  /**
   * Obtiene el inventario de un producto/paquete específico
   * @throws EntidadNoEncontradaError si no existe inventario
   */
  obtenerInventarioPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<InventarioResponseDto>;

  /**
   * Detecta productos con stock bajo y emite eventos (job diario)
   */
  detectarStockBajo(umbral: number): Promise<void>;
}
