import { Inject, Injectable } from '@nestjs/common';
import type { AutenticacionService } from '../../domain/ports/inbound/autenticacion.service';
import type {
  LoginData,
  LoginResult,
  RefreshTokenData,
} from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import type { PasswordHasher } from '../../domain/ports/outbound/password-hasher.port';
import type { TokenGenerator } from '../../domain/ports/outbound/token-generator.port';
import type { EmailService } from '../../domain/ports/outbound/email-service.port';
import type { ConfiguracionPort } from '../../domain/ports/outbound/configuracion.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from '../../domain/ports/tokens';
import type { CuentaUsuario } from '../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import { EstadoCuenta } from '../../domain/aggregates/types';
import {
  CredencialesInvalidasError,
  SesionInvalidaError,
} from '../../domain/exceptions';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { SesionManagementService } from './internal/sesion-management.service';

@Injectable()
export class AutenticacionApplicationService implements AutenticacionService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly sesionManagement: SesionManagementService,
  ) {}

  async login(data: LoginData): Promise<LoginResult> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);
    if (!cuenta) {
      throw new CredencialesInvalidasError();
    }

    this.cuentaValidation.validarCuentaPuedeAutenticarse(cuenta);
    await this.validarPasswordYManejarFallo(data.password, cuenta);

    cuenta.registrarLoginExitoso();

    const { accessToken, refreshToken, expiresIn } =
      await this.sesionManagement.crearNuevaSesion(cuenta, data.userAgent);

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

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { nuevas: [nuevaSesion], actualizadas: [sesion] },
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

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: [sesion] },
    });
  }

  private async validarPasswordYManejarFallo(
    password: string,
    cuenta: CuentaUsuario,
  ): Promise<void> {
    const passwordValido = await this.passwordHasher.compare(
      password,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      await this.manejarLoginFallido(cuenta);
      throw new CredencialesInvalidasError();
    }
  }

  private async manejarLoginFallido(cuenta: CuentaUsuario): Promise<void> {
    const maxIntentos = await this.configuracionPort.obtenerMaxIntentosLogin();
    const minutosBloqueoInicial =
      await this.configuracionPort.obtenerMinutosBloqueoInicial();

    cuenta.registrarIntentoFallido(maxIntentos, minutosBloqueoInicial);

    await this.cuentaRepository.guardar(cuenta);

    if (cuenta.estado === EstadoCuenta.BLOQUEADA) {
      await this.emailService.enviarEmailCuentaBloqueada(
        cuenta.email,
        '',
        cuenta.bloqueadoHasta!,
      );
    }
  }
}
