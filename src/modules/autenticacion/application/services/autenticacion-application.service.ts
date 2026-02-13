import { Inject, Injectable } from '@nestjs/common';
import type { AutenticacionService } from '../../domain/ports/inbound/autenticacion.service';
import type {
  LoginData,
  LoginResult,
  RefreshTokenData,
} from '../../domain/types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { PasswordHasher } from '../../domain/ports/outbound/external';
import type { TokenGenerator } from '../../domain/ports/outbound/external';
import type { EmailService } from '../../domain/ports/outbound/external';
import type { ConfiguracionPort } from '../../domain/ports/outbound/integrations';
import type { TransactionManager } from '@shared/database';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CONFIGURACION_PORT_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import type { CuentaUsuario } from '../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import {
  EstadoCuenta,
  TipoEventoAuth,
  ResultadoAuth,
} from '../../domain/aggregates/types';
import {
  CredencialesInvalidasError,
  SesionInvalidaError,
} from '../../domain/exceptions';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { SesionManagementService } from './internal/sesion-management.service';
import { LogAutenticacionFactory } from '../../domain/factories';

@Injectable()
export class AutenticacionApplicationService implements AutenticacionService {
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
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly sesionManagement: SesionManagementService,
  ) {}

  async login(data: LoginData): Promise<LoginResult> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);
    if (!cuenta) {
      await this.registrarLoginFallido(data.email, null, data.userAgent);
      throw new CredencialesInvalidasError();
    }

    this.cuentaValidation.validarCuentaPuedeAutenticarse(cuenta);
    await this.validarPasswordYManejarFallo(
      data.password,
      cuenta,
      data.userAgent,
    );

    cuenta.registrarLoginExitoso();

    const { accessToken, refreshToken, expiresIn } =
      await this.sesionManagement.crearNuevaSesion(cuenta, data.userAgent);

    const sesionesActualizadas = Array.from(cuenta.sesiones);
    const ultimaSesion = sesionesActualizadas[sesionesActualizadas.length - 1];

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.LOGIN,
      resultado: ResultadoAuth.EXITOSO,
      userAgent: data.userAgent,
      metadata: {
        sesion_id: ultimaSesion.id,
        dispositivo: data.userAgent,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, { transactionContext: tx });
      await this.logRepository.guardar(log, tx);
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      userType: cuenta.tipoUsuario,
      userId: cuenta.propietario.getId(),
      requiereCambioPassword: cuenta.requiereCambioPassword(),
    };
  }

  async refreshToken(data: RefreshTokenData): Promise<LoginResult> {
    const refreshTokenHash = this.tokenGenerator.hash(data.refreshToken);

    const cuenta =
      await this.cuentaRepository.buscarPorRefreshToken(refreshTokenHash);
    if (!cuenta) {
      throw new SesionInvalidaError();
    }

    this.cuentaValidation.validarCuentaPuedeAutenticarse(cuenta);

    const sesion = this.sesionManagement.validarYObtenerSesionActiva(
      cuenta,
      refreshTokenHash,
    );

    const {
      accessToken,
      refreshToken: nuevoRefreshToken,
      sesion: nuevaSesion,
      expiresIn,
    } = await this.sesionManagement.generarNuevaSesion(
      cuenta,
      sesion.dispositivo ?? undefined,
    );

    sesion.revocar({ motivo: 'Rotación automática de refresh token' });
    cuenta.agregarSesion(nuevaSesion);

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.REFRESH_TOKEN,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        sesion_id: nuevaSesion.id,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        sesiones: { nuevas: [nuevaSesion], actualizadas: [sesion] },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
    });

    return {
      accessToken,
      refreshToken: nuevoRefreshToken,
      expiresIn,
      userType: cuenta.tipoUsuario,
      userId: cuenta.propietario.getId(),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.tokenGenerator.hash(refreshToken);

    const cuenta =
      await this.cuentaRepository.buscarPorRefreshToken(refreshTokenHash);
    if (!cuenta) {
      return;
    }

    const sesion = cuenta.sesiones.find(
      (s) => s.refreshTokenHash === refreshTokenHash,
    );
    if (!sesion) {
      return;
    }

    sesion.revocar({ motivo: 'Logout manual' });

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.LOGOUT,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        sesion_id: sesion.id,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        sesiones: { actualizadas: [sesion] },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
    });
  }

  private async validarPasswordYManejarFallo(
    password: string,
    cuenta: CuentaUsuario,
    userAgent: string,
  ): Promise<void> {
    const passwordValido = await this.passwordHasher.compare(
      password,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      await this.manejarLoginFallido(cuenta, userAgent);
      throw new CredencialesInvalidasError();
    }
  }

  private async manejarLoginFallido(
    cuenta: CuentaUsuario,
    userAgent: string,
  ): Promise<void> {
    const maxIntentos = await this.configuracionPort.obtenerMaxIntentosLogin();
    const minutosBloqueoInicial =
      await this.configuracionPort.obtenerMinutosBloqueoInicial();

    const intentosAntesDeIncremento = cuenta.intentosFallidos;
    cuenta.registrarIntentoFallido(maxIntentos, minutosBloqueoInicial);

    const logFallido = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.LOGIN,
      resultado: ResultadoAuth.FALLIDO,
      motivoFallo: 'Credenciales inválidas',
      userAgent,
      metadata: { intentos_fallidos: intentosAntesDeIncremento + 1 },
    });

    if (cuenta.estado === EstadoCuenta.BLOQUEADA) {
      const logBloqueo = LogAutenticacionFactory.crear({
        emailIntento: cuenta.email,
        cuentaUsuarioId: cuenta.id,
        tipoEvento: TipoEventoAuth.BLOQUEO_CUENTA,
        resultado: ResultadoAuth.EXITOSO,
        userAgent,
        metadata: {
          bloqueado_hasta: cuenta.bloqueadoHasta,
          numero_bloqueo: cuenta.numeroBloqueos,
        },
      });

      await this.transactionManager.transaction(async (tx) => {
        await this.cuentaRepository.guardar(cuenta, { transactionContext: tx });
        await this.logRepository.guardar(logFallido, tx);
        await this.logRepository.guardar(logBloqueo, tx);
      });

      await this.emailService.enviarEmailCuentaBloqueada(
        cuenta.email,
        '',
        cuenta.bloqueadoHasta!,
      );
    } else {
      await this.transactionManager.transaction(async (tx) => {
        await this.cuentaRepository.guardar(cuenta, { transactionContext: tx });
        await this.logRepository.guardar(logFallido, tx);
      });
    }
  }

  private async registrarLoginFallido(
    email: string,
    cuentaUsuarioId: string | null,
    userAgent: string,
  ): Promise<void> {
    const log = LogAutenticacionFactory.crear({
      emailIntento: email,
      cuentaUsuarioId,
      tipoEvento: TipoEventoAuth.LOGIN,
      resultado: ResultadoAuth.FALLIDO,
      motivoFallo: 'Credenciales inválidas',
      userAgent,
      metadata: null,
    });

    await this.logRepository.guardar(log);
  }
}
