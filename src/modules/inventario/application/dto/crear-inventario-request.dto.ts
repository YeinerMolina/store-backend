export interface CrearInventarioRequestDto {
  tipoItem: string;
  itemId: string;
  ubicacion?: string;
  cantidadInicial: number;
  empleadoId: string;
  notas?: string;
}
