import { Inject, Injectable } from '@nestjs/common';
import type { VerificacionEmailService } from '../../domain/ports/inbound/verificacion-email.service';
import type { VerificarEmailData } from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import type { TokenGenerator } from '../../domain/ports/outbound/token-generator.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  TOKEN_GENERATOR_TOKEN,
} from '../../domain/ports/tokens';
import { TipoTokenRecuperacion } from '../../domain/aggregates/types';
import { TokenRecoveryService } from './internal/token-recovery.service';

@Injectable()
export class VerificacionEmailApplicationService implements VerificacionEmailService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    private readonly tokenRecovery: TokenRecoveryService,
  ) {}

  async verificarEmail(data: VerificarEmailData): Promise<void> {
    const tokenHash = this.tokenGenerator.hash(data.token);
    const cuenta = await this.tokenRecovery.buscarCuentaPorTokenHash(tokenHash);
    const token = this.tokenRecovery.validarYObtenerTokenRecuperacion(
      cuenta,
      tokenHash,
      TipoTokenRecuperacion.VERIFICACION_EMAIL,
    );

    cuenta.verificarEmail();
    token.marcarComoUsado();

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { actualizados: [token] },
    });
  }
}
