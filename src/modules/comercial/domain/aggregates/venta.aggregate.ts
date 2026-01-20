import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { LineaVenta } from './linea-venta.entity';
import { VentaCreada } from '../events/venta-creada.event';
import { VentaConfirmada } from '../events/venta-confirmada.event';

/**
 * AGREGADO: Venta
 * Root del agregado que representa una transacción comercial
 *
 * INVARIANTES:
 * 1. Una venta debe tener AL MENOS una línea
 * 2. Los precios en LineaVenta son CONTRACTUALES (fijados al crear venta)
 * 3. Total de venta = subtotal - descuento + costo_envio
 * 4. Cambios solo sobre líneas con puede_ser_cambiada = true
 */

export enum EstadoVenta {
  BORRADOR = 'BORRADOR',
  CONFIRMADA = 'CONFIRMADA',
  EN_PREPARACION = 'EN_PREPARACION',
  ENVIADA = 'ENVIADA',
  ENTREGADA = 'ENTREGADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoVenta {
  FISICA = 'FISICA',
  DIGITAL = 'DIGITAL',
}

export enum ModalidadEntrega {
  RETIRO_LOCAL = 'RETIRO_LOCAL',
  ENTREGA_EXTERNA = 'ENTREGA_EXTERNA',
}

interface VentaProps {
  id: UUID;
  clienteId: UUID;
  empleadoId: UUID | null;
  carritoOrigenId: UUID | null;
  tipo: TipoVenta;
  modalidadEntrega: ModalidadEntrega;
  estado: EstadoVenta;
  lineas: LineaVenta[];
  subtotal: Money;
  descuento: Money;
  costoEnvio: Money;
  total: Money;
  direccionEntregaSnapshot: any | null;
  fechaCreacion: Date;
  fechaConfirmacion: Date | null;
  fechaEntrega: Date | null;
}

export class Venta {
  private props: VentaProps;
  private eventos: any[] = [];

  private constructor(props: VentaProps) {
    this.props = props;
  }

  /**
   * Factory Method: Crear Venta desde Carrito
   * Este es el punto de entrada principal para crear ventas
   */
  static crear(params: {
    clienteId: UUID;
    empleadoId: UUID | null;
    carritoOrigenId: UUID | null;
    tipo: TipoVenta;
    modalidadEntrega: ModalidadEntrega;
    lineas: LineaVenta[];
    descuento?: Money;
    costoEnvio?: Money;
    direccionEntregaSnapshot?: any;
  }): Venta {
    // INVARIANTE 1: Al menos una línea
    if (params.lineas.length === 0) {
      throw new Error('La venta debe tener al menos una línea');
    }

    // Calcular totales
    const subtotal = params.lineas.reduce(
      (acc, linea) => acc.add(linea.getSubtotal()),
      Money.zero(),
    );

    const descuento = params.descuento || Money.zero();
    const costoEnvio = params.costoEnvio || Money.zero();

    // INVARIANTE 3: Total = subtotal - descuento + costo_envio
    const total = subtotal.subtract(descuento).add(costoEnvio);

    const venta = new Venta({
      id: UUID.create(),
      clienteId: params.clienteId,
      empleadoId: params.empleadoId,
      carritoOrigenId: params.carritoOrigenId,
      tipo: params.tipo,
      modalidadEntrega: params.modalidadEntrega,
      estado: EstadoVenta.BORRADOR,
      lineas: params.lineas,
      subtotal,
      descuento,
      costoEnvio,
      total,
      direccionEntregaSnapshot: params.direccionEntregaSnapshot || null,
      fechaCreacion: new Date(),
      fechaConfirmacion: null,
      fechaEntrega: null,
    });

    // Emitir evento de dominio
    venta.eventos.push(
      new VentaCreada(
        venta.props.id,
        venta.props.clienteId,
        venta.props.carritoOrigenId,
      ),
    );

    return venta;
  }

  /**
   * Confirmar Venta (cuando se recibe pago exitoso)
   */
  confirmar(): void {
    if (this.props.estado !== EstadoVenta.BORRADOR) {
      throw new Error(
        `No se puede confirmar una venta en estado ${this.props.estado}`,
      );
    }

    this.props.estado = EstadoVenta.CONFIRMADA;
    this.props.fechaConfirmacion = new Date();

    this.eventos.push(new VentaConfirmada(this.props.id, this.props.total));
  }

  /**
   * Marcar como entregada
   */
  marcarComoEntregada(): void {
    if (
      this.props.estado !== EstadoVenta.CONFIRMADA &&
      this.props.estado !== EstadoVenta.ENVIADA
    ) {
      throw new Error(
        `No se puede entregar una venta en estado ${this.props.estado}`,
      );
    }

    this.props.estado = EstadoVenta.ENTREGADA;
    this.props.fechaEntrega = new Date();
  }

  // Getters
  getId(): UUID {
    return this.props.id;
  }

  getClienteId(): UUID {
    return this.props.clienteId;
  }

  getEstado(): EstadoVenta {
    return this.props.estado;
  }

  getTotal(): Money {
    return this.props.total;
  }

  getLineas(): LineaVenta[] {
    return [...this.props.lineas]; // Retornar copia para inmutabilidad
  }

  getEventos(): any[] {
    return [...this.eventos];
  }

  limpiarEventos(): void {
    this.eventos = [];
  }
}
