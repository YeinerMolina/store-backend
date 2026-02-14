import { Inject, Injectable } from '@nestjs/common';
import type { AdminCuentaService } from '../../domain/ports/inbound/admin-cuenta.service';
import type { InformacionCuenta } from '../../domain/types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { EmailService } from '../../domain/ports/outbound/external';
import type { TransactionManager } from '@shared/database/ports/transaction-manager.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  EMAIL_SERVICE_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { LogAutenticacionFactory } from '../../domain/factories';
import { TipoEventoAuth, ResultadoAuth } from '../../domain/aggregates/types';

@Injectable()
export class AdminCuentaApplicationService implements AdminCuentaService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(LOG_AUTENTICACION_REPOSITORY_TOKEN)
    private readonly logRepository: LogAutenticacionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    private readonly cuentaValidation: CuentaValidationService,
  ) {}

  async desbloquearCuenta(
    accountId: string,
    empleadoId: string,
  ): Promise<void> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    cuenta.desbloquearManualmente();

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.DESBLOQUEO_CUENTA,
      resultado: ResultadoAuth.EXITOSO,
      metadata: { empleado_id: empleadoId },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, { transactionContext: tx });
      await this.logRepository.guardar(log, tx);
    });

    await this.emailService.enviarEmailCuentaDesbloqueada(cuenta.email, '');
  }

  async obtenerInformacionCuenta(
    accountId: string,
  ): Promise<InformacionCuenta> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    const userId = cuenta.propietario.getId();

    return {
      userId,
      accountId: cuenta.id,
      email: cuenta.email,
      tipoUsuario: cuenta.tipoUsuario,
      emailVerificado: cuenta.emailVerificado,
      ultimoLogin: cuenta.ultimoLogin,
    };
  }
}
