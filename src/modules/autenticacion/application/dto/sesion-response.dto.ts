export interface SesionResponseDto {
  id: string;
  dispositivo: string | null;
  fechaCreacion: string;
  fechaUltimoUso: string | null;
  fechaExpiracion: string;
}
