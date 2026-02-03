import {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  CrearPoliticaProps,
  ParametroOperativoData,
  PoliticaData,
  PublicarPoliticaProps,
  isTipoDato,
  isTipoPolitica,
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
      id: p.getId(),
      clave: p.getClave(),
      nombre: p.getNombre(),
      descripcion: p.getDescripcion(),
      tipoDato: p.getTipoDato(),
      valor: p.getValor(),
      valorDefecto: p.getValorDefecto(),
      valorMinimo: p.getValorMinimo(),
      valorMaximo: p.getValorMaximo(),
      requiereReinicio: p.isRequiereReinicio(),
      modificadoPorId: p.getModificadoPorId(),
      fechaModificacion: p.getFechaModificacion(),
    };
  }

  static politicaToData(p: Politica): PoliticaData {
    return {
      id: p.getId(),
      tipo: p.getTipo(),
      version: p.getVersion(),
      contenido: p.getContenido(),
      estado: p.getEstado(),
      fechaVigenciaDesde: p.getFechaVigenciaDesde(),
      fechaVigenciaHasta: p.getFechaVigenciaHasta(),
      publicadoPorId: p.getPublicadoPorId(),
      fechaCreacion: p.getFechaCreacion(),
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
    if (!isTipoDato(request.tipoDato)) {
      throw new Error(`Tipo de dato inválido: ${request.tipoDato}`);
    }

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

  /**
   * modificadoPorId viene del contexto HTTP (usuario autenticado), no del request.
   */
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
    if (!isTipoPolitica(request.tipo)) {
      throw new Error(`Tipo de política inválido: ${request.tipo}`);
    }

    return {
      tipo: request.tipo,
      version: request.version,
      contenido: request.contenido,
      publicadoPorId: undefined,
    };
  }

  /**
   * publicadoPorId viene del contexto HTTP (usuario autenticado).
   */
  static publicarRequestToProps(
    request: PublicarPoliticaRequestDto,
  ): PublicarPoliticaProps {
    return {
      fechaVigenciaDesde: request.fechaVigenciaDesde,
      publicadoPorId: undefined,
    };
  }
}
