import type { ReservarInventarioRequestDto } from '../../../application/dto/reservar-inventario-request.dto';
import type { ConsolidarReservaRequestDto } from '../../../application/dto/consolidar-reserva-request.dto';
import type { AjustarInventarioRequestDto } from '../../../application/dto/ajustar-inventario-request.dto';
import type { ConsultarDisponibilidadRequestDto } from '../../../application/dto/consultar-disponibilidad-request.dto';
import type { ReservaResponseDto } from '../../../application/dto/reserva-response.dto';
import type { DisponibilidadResponseDto } from '../../../application/dto/disponibilidad-response.dto';
import type { InventarioResponseDto } from '../../../application/dto/inventario-response.dto';
import { INVENTARIO_SERVICE_TOKEN } from '../tokens';

export { INVENTARIO_SERVICE_TOKEN };

/**
 * Puerto Inbound: Define los casos de uso del módulo INVENTARIO.
 * Implementado por InventarioApplicationService.
 */
export interface InventarioService {
  /**
   * @throws StockInsuficienteError, OptimisticLockingError
   */
  reservarInventario(
    request: ReservarInventarioRequestDto,
  ): Promise<ReservaResponseDto>;

  /**
   * @throws EntidadNoEncontradaError, EstadoInvalidoError
   */
  consolidarReserva(request: ConsolidarReservaRequestDto): Promise<void>;

  liberarReservasExpiradas(): Promise<void>;

  /**
   * @throws EntidadNoEncontradaError, PermisoInsuficienteError
   */
  ajustarInventario(request: AjustarInventarioRequestDto): Promise<void>;

  consultarDisponibilidad(
    request: ConsultarDisponibilidadRequestDto,
  ): Promise<DisponibilidadResponseDto>;

  /**
   * @throws EntidadNoEncontradaError
   */
  obtenerInventarioPorItem(
    tipoItem: string,
    itemId: string,
  ): Promise<InventarioResponseDto>;

  detectarStockBajo(umbral: number): Promise<void>;
}
