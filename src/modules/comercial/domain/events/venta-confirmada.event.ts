import { EventoDominioBase } from '../../../../shared/domain/events/evento-dominio.base';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../shared/domain/value-objects/money.vo';

/**
 * EVENTO DE DOMINIO: VentaConfirmada
 * Se emite cuando el pago es exitoso y la venta se confirma
 */
export class VentaConfirmada extends EventoDominioBase {
  constructor(
    public readonly ventaId: UUID,
    public readonly total: Money,
  ) {
    super('VentaConfirmada');
  }

  toPrimitives(): Record<string, any> {
    return {
      eventoId: this.eventoId.toString(),
      tipoEvento: this.tipoEvento,
      ocurridoEn: this.ocurridoEn.toISOString(),
      ventaId: this.ventaId.toString(),
      total: this.total.getAmount(),
      moneda: this.total.getCurrency(),
    };
  }
}
