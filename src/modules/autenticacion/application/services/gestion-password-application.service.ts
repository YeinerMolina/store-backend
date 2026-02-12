import { Inject, Injectable } from '@nestjs/common';
import type { GestionPasswordService } from '../../domain/ports/inbound/gestion-password.service';
import type {
  SolicitarRecuperacionData,
  EjecutarRecuperacionData,
  CambiarPasswordData,
} from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import type { PasswordHasher } from '../../domain/ports/outbound/password-hasher.port';
import type { TokenGenerator } from '../../domain/ports/outbound/token-generator.port';
import type { EmailService } from '../../domain/ports/outbound/email-service.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SERVICE_TOKEN,
} from '../../domain/ports/tokens';
import { TipoTokenRecuperacion } from '../../domain/aggregates/types';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { TokenRecoveryService } from './internal/token-recovery.service';
import { SesionManagementService } from './internal/sesion-management.service';

@Injectable()
export class GestionPasswordApplicationService implements GestionPasswordService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly tokenRecovery: TokenRecoveryService,
    private readonly sesionManagement: SesionManagementService,
  ) {}

  async solicitarRecuperacionPassword(
    data: SolicitarRecuperacionData,
  ): Promise<void> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);
    if (!cuenta) {
      return;
    }

    const { token, tokenRecuperacion } =
      await this.tokenRecovery.crearTokenRecuperacion(
        cuenta.id,
        TipoTokenRecuperacion.RECUPERACION_PASSWORD,
      );

    cuenta.agregarTokenRecuperacion(tokenRecuperacion);

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { nuevos: [tokenRecuperacion] },
    });

    await this.emailService.enviarEmailRecuperacionPassword(
      cuenta.email,
      '',
      token,
    );
  }

  async ejecutarRecuperacionPassword(
    data: EjecutarRecuperacionData,
  ): Promise<void> {
    const tokenHash = this.tokenGenerator.hash(data.token);
    const cuenta = await this.tokenRecovery.buscarCuentaPorTokenHash(tokenHash);
    const token = this.tokenRecovery.validarYObtenerTokenRecuperacion(
      cuenta,
      tokenHash,
      TipoTokenRecuperacion.RECUPERACION_PASSWORD,
    );

    const nuevoPasswordHash = await this.passwordHasher.hash(data.newPassword);

    cuenta.cambiarPassword(nuevoPasswordHash);
    cuenta.desbloquearYResetearIntentos();
    token.marcarComoUsado();

    const sesionesActivas =
      this.sesionManagement.obtenerSesionesActivasDeCuenta(cuenta);
    this.sesionManagement.revocarSesionesActivas(
      sesionesActivas,
      'Recuperación de contraseña',
    );

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { actualizados: [token] },
      sesiones: { actualizadas: sesionesActivas },
    });
  }

  async cambiarPassword(
    accountId: string,
    data: CambiarPasswordData,
  ): Promise<void> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    await this.cuentaValidation.validarPasswordActual(
      data.currentPassword,
      cuenta,
    );

    const nuevoPasswordHash = await this.passwordHasher.hash(data.newPassword);
    cuenta.cambiarPassword(nuevoPasswordHash);

    const sesionesActualizadas =
      this.sesionManagement.revocarSesionesCondicional(
        cuenta,
        data.revocarOtrasSesiones,
        'Cambio de contraseña',
      );

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: sesionesActualizadas },
    });
  }
}
