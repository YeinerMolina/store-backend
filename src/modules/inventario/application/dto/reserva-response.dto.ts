export class ReservaResponseDto {
  id: string;
  inventarioId: string;
  tipoOperacion: string;
  operacionId: string;
  cantidad: number;
  estado: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaResolucion?: string;
  actorTipo: string;
  actorId: string;
  estaExpirada: boolean;
}
