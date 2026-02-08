import type {
  ActualizarParametroOperativoProps,
  CrearParametroOperativoProps,
  CrearPoliticaProps,
  PublicarPoliticaProps,
} from '@configuracion/domain';
import type {
  ActualizarParametroOperativoRequestDto,
  CrearParametroOperativoRequestDto,
  CrearPoliticaRequestDto,
  PublicarPoliticaRequestDto,
} from '../dto/configuracion-request.dto';

export class ConfiguracionRequestMapper {
  static toCrearParametroProps(
    request: CrearParametroOperativoRequestDto,
  ): CrearParametroOperativoProps {
    return {
      ...request,
      requiereReinicio: request.requiereReinicio ?? false,
    };
  }

  static toActualizarParametroProps(
    request: ActualizarParametroOperativoRequestDto,
    modificadoPorId: string,
  ): ActualizarParametroOperativoProps {
    return {
      ...request,
      modificadoPorId,
    };
  }

  static toCrearPoliticaProps(
    request: CrearPoliticaRequestDto,
    publicadoPorId: string,
  ): CrearPoliticaProps {
    return {
      ...request,
      publicadoPorId,
    };
  }

  static toPublicarPoliticaProps(
    request: PublicarPoliticaRequestDto,
    publicadoPorId: string,
  ): PublicarPoliticaProps {
    return {
      ...request,
      publicadoPorId,
    };
  }
}
