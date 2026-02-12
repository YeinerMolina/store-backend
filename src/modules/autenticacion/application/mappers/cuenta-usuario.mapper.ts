import type { CuentaUsuario } from '../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import type { CuentaInfoResponseDto } from '../dto/cuenta-info-response.dto';

export class CuentaUsuarioMapper {
  static toCuentaInfoResponseDto(cuenta: CuentaUsuario): CuentaInfoResponseDto {
    return {
      accountId: cuenta.id,
      email: cuenta.email,
      tipoUsuario: cuenta.tipoUsuario,
      userId: cuenta.propietario.getId(),
      emailVerificado: cuenta.emailVerificado,
      ultimoLogin: cuenta.ultimoLogin?.toISOString() ?? null,
    };
  }
}
