import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../shared/domain/value-objects/money.vo';

/**
 * ENTIDAD: LineaVenta
 * Parte del agregado Venta
 * Representa un ítem vendido con precio CONTRACTUAL
 */

export enum TipoItem {
  PRODUCTO = 'PRODUCTO',
  PAQUETE = 'PAQUETE',
}

interface LineaVentaProps {
  id: UUID;
  ventaId: UUID;
  tipoItem: TipoItem;
  itemId: UUID;
  nombreItem: string;
  cantidad: number;
  precioUnitario: Money; // CONTRACTUAL - No cambia después de creada
  subtotal: Money;
  puedeSerCambiada: boolean;
  esResultadoCambio: boolean;
}

export class LineaVenta {
  private props: LineaVentaProps;

  private constructor(props: LineaVentaProps) {
    this.props = props;
  }

  static crear(params: {
    ventaId: UUID;
    tipoItem: TipoItem;
    itemId: UUID;
    nombreItem: string;
    cantidad: number;
    precioUnitario: Money;
    puedeSerCambiada?: boolean;
    esResultadoCambio?: boolean;
  }): LineaVenta {
    if (params.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const subtotal = params.precioUnitario.multiply(params.cantidad);

    return new LineaVenta({
      id: UUID.create(),
      ventaId: params.ventaId,
      tipoItem: params.tipoItem,
      itemId: params.itemId,
      nombreItem: params.nombreItem,
      cantidad: params.cantidad,
      precioUnitario: params.precioUnitario,
      subtotal,
      puedeSerCambiada: params.puedeSerCambiada ?? true,
      esResultadoCambio: params.esResultadoCambio ?? false,
    });
  }

  // Getters
  getId(): UUID {
    return this.props.id;
  }

  getSubtotal(): Money {
    return this.props.subtotal;
  }

  getPrecioUnitario(): Money {
    return this.props.precioUnitario;
  }

  getCantidad(): number {
    return this.props.cantidad;
  }

  puedeSerCambiada(): boolean {
    return this.props.puedeSerCambiada;
  }
}
