import { Injectable } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import type {
  InventarioPort,
  DisponibilidadResult,
  ReservaParams,
} from '../../domain/ports/outbound/inventario.port';

/**
 * ADAPTADOR OUTBOUND: InventarioHttpAdapter
 * Implementa el puerto InventarioPort usando comunicación HTTP
 * Se comunica con el módulo INVENTARIO vía REST API
 *
 * IMPORTANTE:
 * - El dominio COMERCIAL solo conoce la interfaz (puerto)
 * - Este adaptador puede cambiar su implementación sin afectar el dominio
 *
 * Otras posibles implementaciones:
 * - InventarioEventAdapter (comunicación por eventos)
 * - InventarioInProcessAdapter (llamada directa in-process)
 */
@Injectable()
export class InventarioHttpAdapter implements InventarioPort {
  // TODO: Inyectar cliente HTTP (HttpService de @nestjs/axios)

  async verificarDisponibilidad(
    itemId: UUID,
    cantidad: number,
  ): Promise<boolean> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // const response = await this.http.get(`/inventario/${itemId}/disponibilidad`, { params: { cantidad } });
    // return response.data.disponible;

    console.log(
      `[InventarioHttpAdapter] Verificando disponibilidad: ${itemId}, cantidad: ${cantidad}`,
    );
    return true;
  }

  async verificarDisponibilidadMultiple(
    items: Array<{ itemId: UUID; cantidad: number }>,
  ): Promise<DisponibilidadResult[]> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // const response = await this.http.post('/inventario/disponibilidad/batch', { items });
    // return response.data;

    console.log(
      `[InventarioHttpAdapter] Verificando disponibilidad múltiple: ${items.length} items`,
    );

    return items.map((item) => ({
      itemId: item.itemId,
      disponible: true,
      cantidadDisponible: 100,
    }));
  }

  async reservar(params: ReservaParams): Promise<UUID> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // const response = await this.http.post('/inventario/reservas', params);
    // return UUID.fromString(response.data.reservaId);

    console.log(
      `[InventarioHttpAdapter] Reservando: ${params.itemId}, cantidad: ${params.cantidad}`,
    );

    return UUID.create(); // Simular reservaId
  }

  async consolidarReserva(reservaId: UUID): Promise<void> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // await this.http.post(`/inventario/reservas/${reservaId}/consolidar`);

    console.log(`[InventarioHttpAdapter] Consolidando reserva: ${reservaId}`);
  }

  async cancelarReserva(reservaId: UUID): Promise<void> {
    // TODO: Implementar llamada real al módulo INVENTARIO
    // await this.http.post(`/inventario/reservas/${reservaId}/cancelar`);

    console.log(`[InventarioHttpAdapter] Cancelando reserva: ${reservaId}`);
  }
}
