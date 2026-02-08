import { ApiProperty } from '@nestjs/swagger';

export class ParametroOperativoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'DURACION_RESERVA_VENTA' })
  clave: string;

  @ApiProperty({ example: 'Duración de Reserva para Ventas' })
  nombre: string;

  @ApiProperty({
    example:
      'Tiempo en segundos que se reservan ítems cuando cliente inicia pago online (1200s = 20min)',
    required: false,
  })
  descripcion?: string;

  @ApiProperty({ example: 'ENTERO', enum: ['ENTERO', 'DECIMAL', 'BOOLEAN'] })
  tipoDato: string;

  @ApiProperty({ example: '1200' })
  valor: string;

  @ApiProperty({ example: '1200' })
  valorDefecto: string;

  @ApiProperty({ example: '300', required: false })
  valorMinimo?: string;

  @ApiProperty({ example: '3600', required: false })
  valorMaximo?: string;

  @ApiProperty({ example: false })
  requiereReinicio: boolean;

  @ApiProperty({ example: null, required: false })
  modificadoPorId?: string;

  @ApiProperty({ example: '2026-02-02T21:30:00.000Z' })
  fechaModificacion: string;
}

export class PoliticaResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id: string;

  @ApiProperty({ example: 'CAMBIOS', enum: ['CAMBIOS', 'ENVIOS', 'TERMINOS'] })
  tipo: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({
    example: '# Política de Cambios - v1.0.0\n\n## Elegibilidad...',
  })
  contenido: string;

  @ApiProperty({
    example: 'VIGENTE',
    enum: ['BORRADOR', 'VIGENTE', 'ARCHIVADA'],
  })
  estado: string;

  @ApiProperty({ example: '2026-02-15', required: false })
  fechaVigenciaDesde?: string;

  @ApiProperty({ example: null, required: false })
  fechaVigenciaHasta?: string;

  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  publicadoPorId?: string;

  @ApiProperty({ example: '2026-02-02T22:00:00.000Z' })
  fechaCreacion: string;
}
