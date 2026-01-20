import { Injectable } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import type {
  IInventarioPort,
  DisponibilidadResult,
  ReservaParams,
} from '../../domain/ports/outbound/i-inventario.port';

/**
 * ADAPTADOR OUTBOUND: InventarioAdapter
 * Implementa el puerto IInventarioPort
 * Se comunica con el módulo INVENTARIO
 *
 * IMPORTANTE:
 * - El dominio COMERCIAL solo conoce la interfaz (puerto)
 * - Este adaptador puede cambiar su implementación sin afectar el dominio
 * - Puede ser HTTP, in-process, eventos, etc.
 */
@Injectable()
export class InventarioAdapter implements IInventarioPort {
  // TODO: Inyectar cliente HTTP o servicio del módulo INVENTARIO

  async verificarDisponibilidad(
    itemId: UUID,
    cantidad: number,
  ): Promise<boolean> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // Por ahora simulamos respuesta
    console.log(
      `[InventarioAdapter] Verificando disponibilidad: ${itemId}, cantidad: ${cantidad}`,
    );
    return true;
  }

  async verificarDisponibilidadMultiple(
    items: Array<{ itemId: UUID; cantidad: number }>,
  ): Promise<DisponibilidadResult[]> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    console.log(
      `[InventarioAdapter] Verificando disponibilidad múltiple: ${items.length} items`,
    );

    return items.map((item) => ({
      itemId: item.itemId,
      disponible: true,
      cantidadDisponible: 100,
    }));
  }

  async reservar(params: ReservaParams): Promise<UUID> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    console.log(
      `[InventarioAdapter] Reservando: ${params.itemId}, cantidad: ${params.cantidad}`,
    );

    return UUID.create(); // Simular reservaId
  }

  async consolidarReserva(reservaId: UUID): Promise<void> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    console.log(`[InventarioAdapter] Consolidando reserva: ${reservaId}`);
  }

  async cancelarReserva(reservaId: UUID): Promise<void> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    console.log(`[InventarioAdapter] Cancelando reserva: ${reservaId}`);
  }
}
