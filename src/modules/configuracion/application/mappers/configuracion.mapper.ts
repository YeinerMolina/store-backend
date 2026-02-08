import {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  CrearPoliticaProps,
  ParametroOperativoData,
  PoliticaData,
  PublicarPoliticaProps,
  ParametroOperativo,
  Politica,
} from '@configuracion/domain';
import {
  ActualizarParametroOperativoRequestDto,
  CrearParametroOperativoRequestDto,
  CrearPoliticaRequestDto,
  PublicarPoliticaRequestDto,
} from '../dto/configuracion-request.dto';
import {
  ParametroOperativoResponseDto,
  PoliticaResponseDto,
} from '../dto/configuracion-response.dto';

export class ConfiguracionMapper {
  static parametroToData(p: ParametroOperativo): ParametroOperativoData {
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
      fechaModificacion: p.fechaModificacion,
    };
  }

  static politicaToData(p: Politica): PoliticaData {
    return {
      id: p.id,
      tipo: p.tipo,
      version: p.version,
      contenido: p.contenido,
      estado: p.estado,
      fechaVigenciaDesde: p.fechaVigenciaDesde,
      fechaVigenciaHasta: p.fechaVigenciaHasta,
      publicadoPorId: p.publicadoPorId,
      fechaCreacion: p.fechaCreacion,
    };
  }

  /**
   * Convierte Date a ISO string para HTTP.
   */
  static parametroToResponseDto(
    data: ParametroOperativoData,
  ): ParametroOperativoResponseDto {
    const dto = new ParametroOperativoResponseDto();

    dto.id = data.id;
    dto.clave = data.clave;
    dto.nombre = data.nombre;
    dto.descripcion = data.descripcion;
    dto.tipoDato = data.tipoDato;
    dto.valor = data.valor;
    dto.valorDefecto = data.valorDefecto;
    dto.valorMinimo = data.valorMinimo;
    dto.valorMaximo = data.valorMaximo;
    dto.requiereReinicio = data.requiereReinicio;
    dto.modificadoPorId = data.modificadoPorId;
    dto.fechaModificacion = data.fechaModificacion.toISOString();

    return dto;
  }

  /**
   * Convierte Date a ISO string para HTTP.
   */
  static politicaToResponseDto(data: PoliticaData): PoliticaResponseDto {
    const dto = new PoliticaResponseDto();

    dto.id = data.id;
    dto.tipo = data.tipo;
    dto.version = data.version;
    dto.contenido = data.contenido;
    dto.estado = data.estado;
    dto.fechaVigenciaDesde = data.fechaVigenciaDesde?.toISOString();
    dto.fechaVigenciaHasta = data.fechaVigenciaHasta?.toISOString();
    dto.publicadoPorId = data.publicadoPorId;
    dto.fechaCreacion = data.fechaCreacion.toISOString();

    return dto;
  }

  static crearRequestToProps(
    request: CrearParametroOperativoRequestDto,
  ): CrearParametroOperativoProps {
    return {
      clave: request.clave,
      nombre: request.nombre,
      descripcion: request.descripcion,
      tipoDato: request.tipoDato,
      valor: request.valor,
      valorDefecto: request.valorDefecto,
      valorMinimo: request.valorMinimo,
      valorMaximo: request.valorMaximo,
      requiereReinicio: request.requiereReinicio ?? false,
    };
  }

  static actualizarRequestToProps(
    request: ActualizarParametroOperativoRequestDto,
  ): ActualizarParametroOperativoProps {
    return {
      valor: request.valor,
      modificadoPorId: undefined,
    };
  }

  static crearPoliticaRequestToProps(
    request: CrearPoliticaRequestDto,
  ): CrearPoliticaProps {
    return {
      tipo: request.tipo,
      version: request.version,
      contenido: request.contenido,
      publicadoPorId: undefined,
    };
  }

  static publicarRequestToProps(
    request: PublicarPoliticaRequestDto,
  ): PublicarPoliticaProps {
    return {
      fechaVigenciaDesde: request.fechaVigenciaDesde,
      publicadoPorId: undefined,
    };
  }
}
