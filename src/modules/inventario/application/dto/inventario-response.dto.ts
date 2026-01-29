export interface InventarioResponseDto {
  id: string;
  tipoItem: string;
  itemId: string;
  ubicacion?: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  cantidadAbandono: number;
  version: number;
  fechaActualizacion: string;
}
