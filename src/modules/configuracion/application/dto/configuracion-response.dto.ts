export class ParametroOperativoResponseDto {
  id!: string;
  clave!: string;
  nombre!: string;
  descripcion?: string;
  tipoDato!: string;
  valor!: string;
  valorDefecto!: string;
  valorMinimo?: string;
  valorMaximo?: string;
  requiereReinicio!: boolean;
  modificadoPorId?: string;
  fechaModificacion!: string;
}

export class PoliticaResponseDto {
  id!: string;
  tipo!: string;
  version!: string;
  contenido!: string;
  estado!: string;
  fechaVigenciaDesde?: string;
  fechaVigenciaHasta?: string;
  publicadoPorId?: string;
  fechaCreacion!: string;
}
