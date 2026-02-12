import { Inject, Injectable } from '@nestjs/common';
import type { AdminCuentaService } from '../../domain/ports/inbound/admin-cuenta.service';
import type { InformacionCuenta } from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import type { EmailService } from '../../domain/ports/outbound/email-service.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  EMAIL_SERVICE_TOKEN,
} from '../../domain/ports/tokens';
import { CuentaValidationService } from './internal/cuenta-validation.service';

@Injectable()
export class AdminCuentaApplicationService implements AdminCuentaService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    private readonly cuentaValidation: CuentaValidationService,
  ) {}

  async desbloquearCuenta(accountId: string, _adminId: string): Promise<void> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    cuenta.desbloquearManualmente();

    await this.cuentaRepository.guardar(cuenta);

    await this.emailService.enviarEmailCuentaDesbloqueada(cuenta.email, '');
  }

  async obtenerInformacionCuenta(
    accountId: string,
  ): Promise<InformacionCuenta> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    const userId = cuenta.propietario.getId();

    return {
      accountId: cuenta.id,
      email: cuenta.email,
      tipoUsuario: cuenta.tipoUsuario,
      userId,
      emailVerificado: cuenta.emailVerificado,
      ultimoLogin: cuenta.ultimoLogin,
    };
  }
}
