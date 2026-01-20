import { EventoDominioBase } from '../../../../shared/domain/events/evento-dominio.base';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';

/**
 * EVENTO DE DOMINIO: VentaCreada
 * Se emite cuando se crea una venta desde un carrito
 */
export class VentaCreada extends EventoDominioBase {
  constructor(
    public readonly ventaId: UUID,
    public readonly clienteId: UUID,
    public readonly carritoOrigenId: UUID | null,
  ) {
    super('VentaCreada');
  }

  toPrimitives(): Record<string, any> {
    return {
      eventoId: this.eventoId.toString(),
      tipoEvento: this.tipoEvento,
      ocurridoEn: this.ocurridoEn.toISOString(),
      ventaId: this.ventaId.toString(),
      clienteId: this.clienteId.toString(),
      carritoOrigenId: this.carritoOrigenId?.toString() || null,
    };
  }
}
