import { TipoMovimientoEnum, TipoOperacionEnum } from './types';
import type {
  CrearMovimientoInventarioProps,
  MovimientoInventarioData,
} from './movimiento-inventario.types';

/**
 * Entidad MovimientoInventario - Parte del agregado Inventario
 *
 * Responsabilidades:
 * - Registrar inmutablemente cada cambio en inventario (audit trail)
 * - Capturar estado anterior y posterior para trazabilidad
 * - Vincular movimientos a operaciones origen (ventas, cambios, ajustes)
 * - Soportar auditoría y reconciliación de stock
 *
 * IMPORTANTE: Esta es una entidad INSERT-ONLY. NUNCA se modifica ni elimina.
 */
export class MovimientoInventario {
  /**
   * Intención de movimiento cuando se crea un inventario por primera vez.
   * Used to distinguish initialization from actual business operations.
   */
  static readonly INTENCION_ENTRADA_INICIAL = 'ENTRADA_INICIAL';

  // Propiedades privadas inmutables (entidad INSERT-ONLY)
  #id: string;
  #inventarioId: string;
  #tipoMovimiento: TipoMovimientoEnum;
  #cantidad: number;
  #cantidadAnterior: number;
  #cantidadPosterior: number;
  #tipoOperacionOrigen?: TipoOperacionEnum;
  #operacionOrigenId?: string;
  #empleadoId?: string;
  #intencion?: string;
  #notas?: string;
  #fechaMovimiento: Date;

  get id(): string {
    return this.#id;
  }

  get inventarioId(): string {
    return this.#inventarioId;
  }

  get tipoMovimiento(): TipoMovimientoEnum {
    return this.#tipoMovimiento;
  }

  get cantidad(): number {
    return this.#cantidad;
  }

  get cantidadAnterior(): number {
    return this.#cantidadAnterior;
  }

  get cantidadPosterior(): number {
    return this.#cantidadPosterior;
  }

  get tipoOperacionOrigen(): TipoOperacionEnum | undefined {
    return this.#tipoOperacionOrigen;
  }

  get operacionOrigenId(): string | undefined {
    return this.#operacionOrigenId;
  }

  get empleadoId(): string | undefined {
    return this.#empleadoId;
  }

  get intencion(): string | undefined {
    return this.#intencion;
  }

  get notas(): string | undefined {
    return this.#notas;
  }

  get fechaMovimiento(): Date {
    return this.#fechaMovimiento;
  }

  private constructor() {}

  /**
   * Factory method para reconstruir MovimientoInventario desde persistencia
   */
  static desde(data: MovimientoInventarioData): MovimientoInventario {
    const movimiento = new MovimientoInventario();
    movimiento.#id = data.id;
    movimiento.#inventarioId = data.inventarioId;
    movimiento.#tipoMovimiento = data.tipoMovimiento;
    movimiento.#cantidad = data.cantidad;
    movimiento.#cantidadAnterior = data.cantidadAnterior;
    movimiento.#cantidadPosterior = data.cantidadPosterior;
    movimiento.#tipoOperacionOrigen = data.tipoOperacionOrigen;
    movimiento.#operacionOrigenId = data.operacionOrigenId;
    movimiento.#empleadoId = data.empleadoId;
    movimiento.#intencion = data.intencion;
    movimiento.#notas = data.notas;
    movimiento.#fechaMovimiento = data.fechaMovimiento;

    return movimiento;
  }
}
