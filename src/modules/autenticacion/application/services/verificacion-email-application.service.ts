import { Inject, Injectable } from '@nestjs/common';
import type { VerificacionEmailService } from '../../domain/ports/inbound/verificacion-email.service';
import type { VerificarEmailData } from '../../domain/types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { TokenGenerator } from '../../domain/ports/outbound/external';
import type { TransactionManager } from '@shared/database';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import {
  TipoTokenRecuperacion,
  TipoEventoAuth,
  ResultadoAuth,
} from '../../domain/aggregates/types';
import { TokenRecoveryService } from './internal/token-recovery.service';
import { LogAutenticacionFactory } from '../../domain/factories';

@Injectable()
export class VerificacionEmailApplicationService implements VerificacionEmailService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(LOG_AUTENTICACION_REPOSITORY_TOKEN)
    private readonly logRepository: LogAutenticacionRepository,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
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

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.VERIFICACION_EMAIL,
      resultado: ResultadoAuth.EXITOSO,
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        tokensRecuperacion: { actualizados: [token] },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
    });
  }
}
