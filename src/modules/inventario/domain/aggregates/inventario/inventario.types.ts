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
 * Props para método de agregado reservar()
 */
export interface ReservarInventarioProps {
  readonly cantidad: number;
  readonly operacionId: string;
  readonly tipoOperacion: TipoOperacionEnum;
  readonly actorTipo: TipoActorEnum;
  readonly actorId: string;
  readonly segundosExpiracion: number;
}

/**
 * Props para caso de uso ReservarInventario (Application Service)
 */
export interface ReservarInventarioCommand {
  readonly tipoItem: TipoItemEnum;
  readonly itemId: string;
  readonly cantidad: number;
  readonly operacionId: string;
  readonly tipoOperacion: TipoOperacionEnum;
  readonly actorTipo: TipoActorEnum;
  readonly actorId: string;
}

/**
 * Props para método de agregado ajustar()
 */
export interface AjustarInventarioProps {
  readonly cantidad: number;
  readonly empleadoId: string;
  readonly intencion?: string;
  readonly notas?: string;
}

/**
 * Props para caso de uso AjustarInventario (Command)
 */
export interface AjustarInventarioCommand {
  readonly inventarioId: string;
  readonly cantidad: number;
  readonly empleadoId: string;
  readonly intencion?: string;
  readonly notas?: string;
}

/**
 * Props para crear inventario con cantidad inicial
 */
export interface CrearInventarioConCantidadProps {
  readonly tipoItem: TipoItemEnum;
  readonly itemId: string;
  readonly ubicacion?: string;
  readonly cantidadInicial: number;
  readonly empleadoId: string;
  readonly notas?: string;
}

/**
 * Props para consolidar reserva
 */
export interface ConsolidarReservaProps {
  readonly operacionId: string;
}

/**
 * Props para consultar disponibilidad
 */
export interface ConsultarDisponibilidadProps {
  readonly tipoItem: TipoItemEnum;
  readonly itemId: string;
  readonly cantidad: number;
}

/**
 * Props para eliminar inventario
 */
export interface EliminarInventarioProps {
  readonly inventarioId: string;
}

/**
 * Query result: Disponibilidad
 * Este NO es una copia del agregado, es un read model computado.
 */
export interface DisponibilidadResponse {
  readonly disponible: boolean;
  readonly cantidadDisponible: number;
  readonly cantidadSolicitada: number;
  readonly mensaje: string;
}
