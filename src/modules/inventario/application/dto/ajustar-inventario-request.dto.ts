export class AjustarInventarioRequestDto {
  inventarioId: string;
  cantidad: number;
  empleadoId: string;
  intencion?: string;
  notas?: string;
}
