/**
 * Mapper: Transforms between domain and application layers.
 *
 * Domain → DTO: Converts domain data to HTTP responses (Date → ISO string).
 * Request DTO → Domain Props: Converts HTTP input to domain props (string → enum).
 *
 * Note: Persistence mappers (entity ↔ database) live in infrastructure/persistence/mappers/
 */

import {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  CrearPoliticaProps,
  ParametroOperativoData,
  PoliticaData,
  PublicarPoliticaProps,
  TipoDatoEnum,
  TipoPoliticaEnum,
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
  /**
   * Domain data → Response DTO.
   * Converts Date to ISO string for HTTP transmission.
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
   * Domain data → Response DTO.
   * Converts Date to ISO string for HTTP transmission.
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

  /**
   * Request DTO → Domain props.
   * Converts string tipoDato (from HTTP) to domain enum.
   * Zod already validated the enum, so cast is safe.
   */
  static crearRequestToProps(
    request: CrearParametroOperativoRequestDto,
  ): CrearParametroOperativoProps {
    const tipoDato = Object.values(TipoDatoEnum).includes(
      request.tipoDato as any,
    )
      ? (request.tipoDato as any)
      : (() => {
          throw new Error(`Tipo de dato inválido: ${request.tipoDato}`);
        })();

    return {
      clave: request.clave,
      nombre: request.nombre,
      descripcion: request.descripcion,
      tipoDato,
      valor: request.valor,
      valorDefecto: request.valorDefecto,
      valorMinimo: request.valorMinimo,
      valorMaximo: request.valorMaximo,
      requiereReinicio: request.requiereReinicio ?? false,
    };
  }

  /**
   * Request DTO → Domain props.
   * modificadoPorId comes from HTTP context (authenticated user), not from request.
   */
  static actualizarRequestToProps(
    request: ActualizarParametroOperativoRequestDto,
  ): ActualizarParametroOperativoProps {
    return {
      valor: request.valor,
      modificadoPorId: undefined,
    };
  }

  /**
   * Request DTO → Domain props.
   * Converts string tipo (from HTTP) to domain enum.
   */
  static crearPoliticaRequestToProps(
    request: CrearPoliticaRequestDto,
  ): CrearPoliticaProps {
    const tipo = Object.values(TipoPoliticaEnum).includes(request.tipo as any)
      ? (request.tipo as any)
      : (() => {
          throw new Error(`Tipo de política inválido: ${request.tipo}`);
        })();

    return {
      tipo,
      version: request.version,
      contenido: request.contenido,
      publicadoPorId: undefined,
    };
  }

  /**
   * Request DTO → Domain props.
   * publicadoPorId comes from HTTP context (authenticated user).
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
