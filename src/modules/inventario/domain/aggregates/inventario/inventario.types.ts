import { TipoActorEnum, TipoItemEnum, TipoOperacionEnum } from './types';

/**
 * Props para crear una nueva instancia de Inventario
 */
export interface CrearInventarioProps {
  readonly tipoItem: TipoItemEnum;
  readonly itemId: string;
  readonly ubicacion?: string;
}

/**
 * Datos de persistencia para reconstruir Inventario
 */
export interface InventarioData {
  readonly id: string;
  readonly tipoItem: TipoItemEnum;
  readonly itemId: string;
  readonly ubicacion?: string;
  readonly cantidadDisponible: number;
  readonly cantidadReservada: number;
  readonly cantidadAbandono: number;
  readonly version: number;
  readonly fechaActualizacion: Date;
  readonly deleted?: boolean;
}

/**
 * Props para reservar inventario
 */
export interface ReservarInventarioProps {
  readonly cantidad: number;
  readonly operacionId: string;
  readonly tipoOperacion: TipoOperacionEnum;
  readonly actorTipo: TipoActorEnum;
  readonly actorId: string;
  readonly minutosExpiracion: number;
}

/**
 * Props para ajustar inventario manualmente
 */
export interface AjustarInventarioProps {
  readonly cantidad: number;
  readonly empleadoId: string;
  readonly intencion?: string;
  readonly notas?: string;
}
