// Request DTOs y Schemas
export {
  ajustarInventarioRequestSchema,
  type AjustarInventarioRequestDto,
} from './ajustar-inventario-request.schema';

export {
  consolidarReservaRequestSchema,
  type ConsolidarReservaRequestDto,
} from './consolidar-reserva-request.schema';

export {
  consultarDisponibilidadRequestSchema,
  type ConsultarDisponibilidadRequestDto,
} from './consultar-disponibilidad-request.schema';

export {
  crearInventarioRequestSchema,
  type CrearInventarioRequestDto,
} from './crear-inventario-request.schema';

export {
  eliminarInventarioRequestSchema,
  type EliminarInventarioRequestDto,
} from './eliminar-inventario-request.schema';

export {
  reservarInventarioRequestSchema,
  type ReservarInventarioRequestDto,
} from './reservar-inventario-request.schema';

// Response DTOs
export { type DisponibilidadResponseDto } from './disponibilidad-response.dto';
export { type InventarioResponseDto } from './inventario-response.dto';
export { type ReservaResponseDto } from './reserva-response.dto';
