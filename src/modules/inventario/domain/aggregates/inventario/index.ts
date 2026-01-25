// Entidades
export { Inventario } from './inventario.entity';
export { Reserva } from './reserva.entity';
export { MovimientoInventario } from './movimiento-inventario.entity';

// Types de Inventario (Props y Data para reconstrucción)
export type {
  CrearInventarioProps,
  InventarioData,
  ReservarInventarioProps,
  AjustarInventarioProps,
} from './inventario.types';

// Types de Reserva
export type { CrearReservaProps, ReservaData } from './reserva.types';

// Types de MovimientoInventario
export type {
  CrearMovimientoInventarioProps,
  MovimientoInventarioData,
} from './movimiento-inventario.types';

// Types/Enums
export {
  EstadoReservaEnum,
  TipoActorEnum,
  TipoItemEnum,
  TipoMovimientoEnum,
  TipoOperacionEnum,
} from './types';
