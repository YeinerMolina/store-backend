export interface ReservarInventarioRequestDto {
  tipoItem: string;
  itemId: string;
  cantidad: number;
  operacionId: string;
  tipoOperacion: string;
  actorTipo: string;
  actorId: string;
}
