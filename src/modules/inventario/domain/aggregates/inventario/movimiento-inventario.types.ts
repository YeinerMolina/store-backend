import { TipoMovimientoEnum, TipoOperacionEnum } from './types';

/**
 * Props para crear un nuevo MovimientoInventario
 */
export interface CrearMovimientoInventarioProps {
  readonly inventarioId: string;
  readonly tipoMovimiento: TipoMovimientoEnum;
  readonly cantidad: number;
  readonly cantidadAnterior: number;
  readonly cantidadPosterior: number;
  readonly tipoOperacionOrigen?: TipoOperacionEnum;
  readonly operacionOrigenId?: string;
  readonly empleadoId?: string;
  readonly intencion?: string;
  readonly notas?: string;
}

/**
 * Datos de persistencia para reconstruir MovimientoInventario
 */
export interface MovimientoInventarioData {
  readonly id: string;
  readonly inventarioId: string;
  readonly tipoMovimiento: TipoMovimientoEnum;
  readonly cantidad: number;
  readonly cantidadAnterior: number;
  readonly cantidadPosterior: number;
  readonly tipoOperacionOrigen?: TipoOperacionEnum;
  readonly operacionOrigenId?: string;
  readonly empleadoId?: string;
  readonly intencion?: string;
  readonly notas?: string;
  readonly fechaMovimiento: Date;
}
