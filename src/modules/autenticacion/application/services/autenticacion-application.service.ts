import { Inject, Injectable } from '@nestjs/common';
import type { AutenticacionService } from '../../domain/ports/inbound/autenticacion.service';
import type {
  RegistrarClienteData,
  LoginData,
  LoginResult,
  RefreshTokenData,
  VerificarEmailData,
  SolicitarRecuperacionData,
  EjecutarRecuperacionData,
  CambiarPasswordData,
  CrearCuentaEmpleadoData,
  SesionInfo,
} from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import type { PasswordHasher } from '../../domain/ports/outbound/password-hasher.port';
import type { TokenGenerator } from '../../domain/ports/outbound/token-generator.port';
import type { JwtService } from '../../domain/ports/outbound/jwt-service.port';
import type { EmailService } from '../../domain/ports/outbound/email-service.port';
import type { ClientePort } from '../../domain/ports/outbound/cliente.port';
import type { EmpleadoPort } from '../../domain/ports/outbound/empleado.port';
import type { ConfiguracionPort } from '../../domain/ports/outbound/configuracion.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  JWT_SERVICE_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CLIENTE_PORT_TOKEN,
  EMPLEADO_PORT_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from '../../domain/ports/tokens';
import { CuentaUsuarioFactory } from '../../domain/factories/cuenta-usuario.factory';
import { SesionUsuarioFactory } from '../../domain/factories/sesion-usuario.factory';
import { TokenRecuperacionFactory } from '../../domain/factories/token-recuperacion.factory';
import {
  TipoUsuario,
  EstadoSesion,
  TipoTokenRecuperacion,
  EstadoToken,
} from '../../domain/aggregates/types';
import { SesionMapper } from '../mappers/sesion.mapper';
import {
  EmailYaExisteError,
  CuentaNoEncontradaError,
  CredencialesInvalidasError,
  CuentaBloqueadaError,
  CuentaInactivaError,
  EmailNoVerificadoError,
  TokenInvalidoError,
  TokenExpiradoError,
  TokenYaUsadoError,
  SesionInvalidaError,
} from '../../domain/exceptions';

@Injectable()
export class AutenticacionApplicationService implements AutenticacionService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(JWT_SERVICE_TOKEN)
    private readonly jwtService: JwtService,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    @Inject(CLIENTE_PORT_TOKEN)
    private readonly clientePort: ClientePort,
    @Inject(EMPLEADO_PORT_TOKEN)
    private readonly empleadoPort: EmpleadoPort,
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
  ) {}

  async registrarCliente(
    data: RegistrarClienteData,
  ): Promise<{ accountId: string }> {
    const emailExiste = await this.cuentaRepository.existePorEmail(data.email);
    if (emailExiste) {
      throw new EmailYaExisteError(data.email);
    }

    const { clienteId } = await this.clientePort.crearClienteConCuenta({
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
    });

    const passwordHash = await this.passwordHasher.hash(data.password);

    const cuenta = CuentaUsuarioFactory.crearCuentaCliente({
      email: data.email,
      passwordHash,
      clienteId,
    });

    const token = this.tokenGenerator.generate();
    const tokenHash = this.tokenGenerator.hash(token);

    const horasExpiracion =
      await this.configuracionPort.obtenerHorasExpiracionTokenVerificacion();
    const fechaExpiracion = new Date(
      Date.now() + horasExpiracion * 60 * 60 * 1000,
    );

    const tokenRecuperacion = TokenRecuperacionFactory.crear({
      cuentaUsuarioId: cuenta.id,
      tipoToken: TipoTokenRecuperacion.VERIFICACION_EMAIL,
      tokenHash,
      fechaExpiracion,
    });

    cuenta.agregarTokenRecuperacion(tokenRecuperacion);

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { nuevos: [tokenRecuperacion] },
    });

    await this.emailService.enviarEmailVerificacion(
      data.email,
      data.nombre,
      token,
    );

    return { accountId: cuenta.id };
  }

  async login(data: LoginData): Promise<LoginResult> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);
    if (!cuenta) {
      throw new CredencialesInvalidasError();
    }

    const resultadoAuth = cuenta.puedeAutenticarse();
    if (!resultadoAuth.exito) {
      if (resultadoAuth.motivoFallo?.includes('Email no verificado')) {
        throw new EmailNoVerificadoError();
      }
      if (resultadoAuth.motivoFallo?.includes('Cuenta deshabilitada')) {
        throw new CuentaInactivaError();
      }
      if (resultadoAuth.motivoFallo?.includes('Cuenta bloqueada')) {
        throw new CuentaBloqueadaError(cuenta.bloqueadoHasta!);
      }
    }

    const passwordValido = await this.passwordHasher.compare(
      data.password,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      const maxIntentos =
        await this.configuracionPort.obtenerMaxIntentosLogin();
      const minutosBloqueoInicial =
        await this.configuracionPort.obtenerMinutosBloqueoInicial();

      cuenta.registrarIntentoFallido(maxIntentos, {
        numeroBloqueo: 1,
        minutosBloqueoInicial,
      });

      await this.cuentaRepository.guardar(cuenta, {});

      if (cuenta.estado === 'BLOQUEADA') {
        await this.emailService.enviarEmailCuentaBloqueada(
          cuenta.email,
          '',
          cuenta.bloqueadoHasta!,
        );
      }

      throw new CredencialesInvalidasError();
    }

    cuenta.registrarLoginExitoso();

    const userId = cuenta.propietario.getId();

    const { token: accessToken, expiresIn } =
      await this.jwtService.generateAccessToken(
        cuenta.id,
        userId,
        cuenta.tipoUsuario,
      );

    const refreshToken = this.tokenGenerator.generate();
    const refreshTokenHash = this.tokenGenerator.hash(refreshToken);

    const ttlHoras =
      cuenta.tipoUsuario === TipoUsuario.CLIENTE
        ? (await this.configuracionPort.obtenerTTLRefreshTokenClienteDias()) *
          24
        : await this.configuracionPort.obtenerTTLRefreshTokenEmpleadoHoras();

    const fechaExpiracion = new Date(Date.now() + ttlHoras * 60 * 60 * 1000);

    const sesion = SesionUsuarioFactory.crear({
      cuentaUsuarioId: cuenta.id,
      refreshTokenHash,
      dispositivo: data.userAgent,
      fechaExpiracion,
    });

    cuenta.agregarSesion(sesion);

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { nuevas: [sesion] },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      userType: cuenta.tipoUsuario,
      userId,
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

    const sesion = cuenta.sesiones.find(
      (s) =>
        s.refreshTokenHash === refreshTokenHash &&
        s.estado === EstadoSesion.ACTIVA,
    );

    if (!sesion) {
      throw new SesionInvalidaError();
    }

    if (sesion.verificarExpiracion()) {
      await this.cuentaRepository.guardar(cuenta, {
        sesiones: { actualizadas: [sesion] },
      });
      throw new SesionInvalidaError();
    }

    const userId = cuenta.propietario.getId();

    const { token: accessToken, expiresIn } =
      await this.jwtService.generateAccessToken(
        cuenta.id,
        userId,
        cuenta.tipoUsuario,
      );

    const nuevoRefreshToken = this.tokenGenerator.generate();
    const nuevoRefreshTokenHash = this.tokenGenerator.hash(nuevoRefreshToken);

    const ttlHoras =
      cuenta.tipoUsuario === TipoUsuario.CLIENTE
        ? (await this.configuracionPort.obtenerTTLRefreshTokenClienteDias()) *
          24
        : await this.configuracionPort.obtenerTTLRefreshTokenEmpleadoHoras();

    const fechaExpiracion = new Date(Date.now() + ttlHoras * 60 * 60 * 1000);

    const nuevaSesion = SesionUsuarioFactory.crear({
      cuentaUsuarioId: cuenta.id,
      refreshTokenHash: nuevoRefreshTokenHash,
      dispositivo: sesion.dispositivo ?? undefined,
      fechaExpiracion,
    });

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
      userId,
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
      (s) =>
        s.refreshTokenHash === refreshTokenHash &&
        s.estado === EstadoSesion.ACTIVA,
    );

    if (!sesion) {
      return;
    }

    sesion.revocar({ motivo: 'Logout manual' });

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: [sesion] },
    });
  }

  async verificarEmail(data: VerificarEmailData): Promise<void> {
    const tokenHash = this.tokenGenerator.hash(data.token);

    const cuenta = await this.cuentaRepository.buscarPorTokenHash(tokenHash);
    if (!cuenta) {
      throw new TokenInvalidoError();
    }

    const token = cuenta.tokensRecuperacion.find(
      (t) =>
        t.tokenHash === tokenHash &&
        t.tipoToken === TipoTokenRecuperacion.VERIFICACION_EMAIL &&
        t.estado === EstadoToken.PENDIENTE,
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

    cuenta.verificarEmail();
    token.marcarComoUsado();

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { actualizados: [token] },
    });
  }

  async solicitarRecuperacionPassword(
    data: SolicitarRecuperacionData,
  ): Promise<void> {
    const cuenta = await this.cuentaRepository.buscarPorEmail(data.email);
    if (!cuenta) {
      return;
    }

    const token = this.tokenGenerator.generate();
    const tokenHash = this.tokenGenerator.hash(token);

    const minutosExpiracion =
      await this.configuracionPort.obtenerMinutosExpiracionTokenRecuperacion();

    const fechaExpiracion = new Date(
      Date.now() + minutosExpiracion * 60 * 1000,
    );

    const tokenRecuperacion = TokenRecuperacionFactory.crear({
      cuentaUsuarioId: cuenta.id,
      tipoToken: TipoTokenRecuperacion.RECUPERACION_PASSWORD,
      tokenHash,
      fechaExpiracion,
    });

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

    const cuenta = await this.cuentaRepository.buscarPorTokenHash(tokenHash);
    if (!cuenta) {
      throw new TokenInvalidoError();
    }

    const token = cuenta.tokensRecuperacion.find(
      (t) =>
        t.tokenHash === tokenHash &&
        t.tipoToken === TipoTokenRecuperacion.RECUPERACION_PASSWORD &&
        t.estado === EstadoToken.PENDIENTE,
    );

    if (!token) {
      throw new TokenInvalidoError();
    }

    if (token.verificarExpiracion()) {
      throw new TokenExpiradoError();
    }

    const nuevoPasswordHash = await this.passwordHasher.hash(data.newPassword);

    cuenta.cambiarPassword(nuevoPasswordHash);
    cuenta.desbloquearYResetearIntentos();
    token.marcarComoUsado();

    const sesionesActivas = Array.from(cuenta.sesiones).filter(
      (s) => s.estado === EstadoSesion.ACTIVA,
    );

    sesionesActivas.forEach((s) =>
      s.revocar({ motivo: 'Recuperación de contraseña' }),
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
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

    const passwordValido = await this.passwordHasher.compare(
      data.currentPassword,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      throw new CredencialesInvalidasError();
    }

    const nuevoPasswordHash = await this.passwordHasher.hash(data.newPassword);

    cuenta.cambiarPassword(nuevoPasswordHash);

    let sesionesActualizadas: any[] = [];

    if (data.revocarOtrasSesiones) {
      const sesionesActivas = Array.from(cuenta.sesiones).filter(
        (s) => s.estado === EstadoSesion.ACTIVA,
      );

      sesionesActivas.forEach((s) =>
        s.revocar({ motivo: 'Cambio de contraseña' }),
      );

      sesionesActualizadas = sesionesActivas;
    }

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: sesionesActualizadas },
    });
  }

  async crearCuentaEmpleado(
    data: CrearCuentaEmpleadoData,
  ): Promise<{ accountId: string }> {
    const emailExiste = await this.cuentaRepository.existePorEmail(data.email);
    if (emailExiste) {
      throw new EmailYaExisteError(data.email);
    }

    const empleadoExiste = await this.empleadoPort.existePorId(data.empleadoId);
    if (!empleadoExiste) {
      throw new Error('Empleado no encontrado');
    }

    const passwordHash = await this.passwordHasher.hash(data.temporaryPassword);

    const cuenta = CuentaUsuarioFactory.crearCuentaEmpleado({
      email: data.email,
      passwordHash,
      empleadoId: data.empleadoId,
    });

    await this.cuentaRepository.guardar(cuenta);

    const empleado = await this.empleadoPort.buscarPorId(data.empleadoId);

    await this.emailService.enviarEmailCuentaEmpleadoCreada(
      data.email,
      empleado?.nombre ?? '',
      data.temporaryPassword,
    );

    return { accountId: cuenta.id };
  }

  async desbloquearCuenta(accountId: string, adminId: string): Promise<void> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

    cuenta.desbloquearManualmente();

    await this.cuentaRepository.guardar(cuenta);

    await this.emailService.enviarEmailCuentaDesbloqueada(cuenta.email, '');
  }

  async revocarTodasLasSesiones(accountId: string): Promise<number> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

    const sesionesActivas = Array.from(cuenta.sesiones).filter(
      (s) => s.estado === EstadoSesion.ACTIVA,
    );

    sesionesActivas.forEach((s) =>
      s.revocar({ motivo: 'Revocación masiva por usuario' }),
    );

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: sesionesActivas },
    });

    return sesionesActivas.length;
  }

  async obtenerSesionesActivas(accountId: string): Promise<SesionInfo[]> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

    const sesionesActivas = Array.from(cuenta.sesiones).filter(
      (s) => s.estado === EstadoSesion.ACTIVA,
    );

    return sesionesActivas.map((s) => SesionMapper.toSesionInfo(s));
  }

  async revocarSesion(sesionId: string, accountId: string): Promise<void> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

    const sesion = Array.from(cuenta.sesiones).find(
      (s) => s.id === sesionId && s.estado === EstadoSesion.ACTIVA,
    );

    if (!sesion) {
      throw new SesionInvalidaError();
    }

    sesion.revocar({ motivo: 'Revocación manual por usuario' });

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: [sesion] },
    });
  }

  async obtenerInformacionCuenta(accountId: string): Promise<{
    accountId: string;
    email: string;
    tipoUsuario: string;
    userId: string;
    emailVerificado: boolean;
    ultimoLogin: Date | null;
  }> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }

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
