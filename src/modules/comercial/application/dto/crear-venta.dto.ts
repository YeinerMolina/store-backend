/**
 * DTO: CrearVentaDto
 * Objeto de transferencia de datos para crear una venta
 * Se usa en la capa de presentación (controllers)
 */
export class CrearVentaDto {
  carritoId: string; // UUID como string
  clienteId: string; // UUID como string
}

export class CrearVentaResponseDto {
  ventaId: string;
  estado: string;
  total: number;
  moneda: string;
  fechaCreacion: string;
}
