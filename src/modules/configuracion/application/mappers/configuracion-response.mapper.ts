import type { ParametroOperativo, Politica } from '@configuracion/domain';
import type {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from '../dto/configuracion-response.dto';

export class ConfiguracionResponseMapper {
  static toParametroResponseDto(
    p: ParametroOperativo,
  ): ParametroOperativoResponseDto {
    return {
      id: p.id,
      clave: p.clave,
      nombre: p.nombre,
      descripcion: p.descripcion,
      tipoDato: p.tipoDato,
      valor: p.valor,
      valorDefecto: p.valorDefecto,
      valorMinimo: p.valorMinimo,
      valorMaximo: p.valorMaximo,
      requiereReinicio: p.requiereReinicio,
      modificadoPorId: p.modificadoPorId,
      fechaModificacion: p.fechaModificacion.toISOString(),
    };
  }

  static toPoliticaResponseDto(p: Politica): PoliticaResponseDto {
    return {
      id: p.id,
      tipo: p.tipo,
      version: p.version,
      contenido: p.contenido,
      estado: p.estado,
      fechaVigenciaDesde: p.fechaVigenciaDesde?.toISOString(),
      fechaVigenciaHasta: p.fechaVigenciaHasta?.toISOString(),
      publicadoPorId: p.publicadoPorId,
      fechaCreacion: p.fechaCreacion.toISOString(),
    };
  }
}
