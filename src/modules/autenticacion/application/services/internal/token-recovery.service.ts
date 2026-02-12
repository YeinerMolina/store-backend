import { Inject, Injectable } from '@nestjs/common';
import type { CuentaUsuarioRepository } from '../../../domain/ports/outbound/cuenta-usuario.repository';
import type { TokenGenerator } from '../../../domain/ports/outbound/token-generator.port';
import type { ConfiguracionPort } from '../../../domain/ports/outbound/configuracion.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from '../../../domain/ports/tokens';
import type { CuentaUsuario } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import type { TokenRecuperacion } from '../../../domain/aggregates/token-recuperacion/token-recuperacion.entity';
import { TokenRecuperacionFactory } from '../../../domain/factories/token-recuperacion.factory';
import {
  TipoTokenRecuperacion,
  EstadoToken,
} from '../../../domain/aggregates/types';
import {
  TokenInvalidoError,
  TokenExpiradoError,
  TokenYaUsadoError,
} from '../../../domain/exceptions';

/**
 * Servicio interno para manejo de tokens de recuperación y verificación.
 */
@Injectable()
export class TokenRecoveryService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
  ) {}

  async buscarCuentaPorTokenHash(tokenHash: string): Promise<CuentaUsuario> {
    const cuenta = await this.cuentaRepository.buscarPorTokenHash(tokenHash);
    if (!cuenta) {
      throw new TokenInvalidoError();
    }
    return cuenta;
  }

  validarYObtenerTokenRecuperacion(
    cuenta: CuentaUsuario,
    tokenHash: string,
    tipoToken: TipoTokenRecuperacion,
  ): TokenRecuperacion {
    const token = this.buscarTokenRecuperacionPendiente(
      cuenta,
      tokenHash,
      tipoToken,
    );

    if (!token) {
      throw new TokenInvalidoError();
    }

    if (token.verificarExpiracion()) {
      throw new TokenExpiradoError();
    }

    if (token.estado === EstadoToken.USADO) {
      throw new TokenYaUsadoError();
    }

    return token;
  }

  async crearTokenRecuperacion(
    cuentaUsuarioId: string,
    tipoToken: TipoTokenRecuperacion,
  ): Promise<{ token: string; tokenRecuperacion: TokenRecuperacion }> {
    const token = this.tokenGenerator.generate();
    const tokenHash = this.tokenGenerator.hash(token);

    const fechaExpiracion =
      tipoToken === TipoTokenRecuperacion.VERIFICACION_EMAIL
        ? await this.calcularFechaExpiracionTokenVerificacion()
        : await this.calcularFechaExpiracionTokenRecuperacion();

    const tokenRecuperacion = TokenRecuperacionFactory.crear({
      cuentaUsuarioId,
      tipoToken,
      tokenHash,
      fechaExpiracion,
    });

    return { token, tokenRecuperacion };
  }

  private buscarTokenRecuperacionPendiente(
    cuenta: CuentaUsuario,
    tokenHash: string,
    tipoToken: TipoTokenRecuperacion,
  ): TokenRecuperacion | undefined {
    return cuenta.tokensRecuperacion.find(
      (t) =>
        t.tokenHash === tokenHash &&
        t.tipoToken === tipoToken &&
        t.estado === EstadoToken.PENDIENTE,
    );
  }

  private async calcularFechaExpiracionTokenVerificacion(): Promise<Date> {
    const horasExpiracion =
      await this.configuracionPort.obtenerHorasExpiracionTokenVerificacion();
    return new Date(Date.now() + horasExpiracion * 60 * 60 * 1000);
  }

  private async calcularFechaExpiracionTokenRecuperacion(): Promise<Date> {
    const minutosExpiracion =
      await this.configuracionPort.obtenerMinutosExpiracionTokenRecuperacion();
    return new Date(Date.now() + minutosExpiracion * 60 * 1000);
  }
}
