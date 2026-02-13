import { Inject, Injectable } from '@nestjs/common';
import type { GestionPasswordService } from '../../domain/ports/inbound/gestion-password.service';
import type {
  SolicitarRecuperacionData,
  EjecutarRecuperacionData,
  CambiarPasswordData,
} from '../../domain/types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { PasswordHasher } from '../../domain/ports/outbound/external';
import type { TokenGenerator } from '../../domain/ports/outbound/external';
import type { EmailService } from '../../domain/ports/outbound/external';
import type { TransactionManager } from '@shared/database';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SERVICE_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import {
  TipoTokenRecuperacion,
  TipoEventoAuth,
  ResultadoAuth,
} from '../../domain/aggregates/types';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { TokenRecoveryService } from './internal/token-recovery.service';
import { SesionManagementService } from './internal/sesion-management.service';
import { LogAutenticacionFactory } from '../../domain/factories';
import type { CuentaUsuario } from '../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';

@Injectable()
export class GestionPasswordApplicationService implements GestionPasswordService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(LOG_AUTENTICACION_REPOSITORY_TOKEN)
    private readonly logRepository: LogAutenticacionRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly tokenRecovery: TokenRecoveryService,
    private readonly sesionManagement: SesionManagementService,
  ) {}

  async solicitarRecuperacionPassword(
    data: SolicitarRecuperacionData,
  ): Promise<void> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);

    if (!cuenta) {
      await this.registrarRecuperacionSolicitud(data.email, null, null);
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

    await this.registrarRecuperacionSolicitud(
      cuenta.email,
      cuenta.id,
      tokenRecuperacion.id,
    );

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

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.RECUPERACION_PASSWORD_USO,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        token_id: token.id,
        sesiones_revocadas: sesionesActivas.length,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        tokensRecuperacion: { actualizados: [token] },
        sesiones: { actualizadas: sesionesActivas },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
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

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.CAMBIO_PASSWORD,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        tipo_cambio: 'MANUAL',
        sesiones_revocadas: sesionesActualizadas.length,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        sesiones: { actualizadas: sesionesActualizadas },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
    });
  }

  private async registrarRecuperacionSolicitud(
    email: string,
    cuentaUsuarioId: string | null,
    tokenId: string | null,
  ): Promise<void> {
    const log = LogAutenticacionFactory.crear({
      emailIntento: email,
      cuentaUsuarioId,
      tipoEvento: TipoEventoAuth.RECUPERACION_PASSWORD_SOLICITUD,
      resultado: ResultadoAuth.EXITOSO,
      metadata: tokenId ? { token_id: tokenId } : null,
    });

    await this.logRepository.guardar(log);
  }
}
