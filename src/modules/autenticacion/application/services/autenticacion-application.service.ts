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
import { CuentaUsuario } from '../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import { SesionUsuario } from '../../domain/aggregates/sesion-usuario/sesion-usuario.entity';
import { TokenRecuperacion } from '../../domain/aggregates/token-recuperacion/token-recuperacion.entity';
import { CuentaUsuarioFactory } from '../../domain/factories/cuenta-usuario.factory';
import { SesionUsuarioFactory } from '../../domain/factories/sesion-usuario.factory';
import { TokenRecuperacionFactory } from '../../domain/factories/token-recuperacion.factory';
import {
  TipoUsuario,
  EstadoSesion,
  TipoTokenRecuperacion,
  EstadoToken,
  EstadoCuenta,
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

    const { token, tokenRecuperacion } = await this.crearTokenRecuperacion(
      cuenta.id,
      TipoTokenRecuperacion.VERIFICACION_EMAIL,
    );

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
    if (!resultadoAuth.exito && resultadoAuth.error) {
      throw resultadoAuth.error;
    }

    const passwordValido = await this.passwordHasher.compare(
      data.password,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      await this.manejarLoginFallido(cuenta);
      throw new CredencialesInvalidasError();
    }

    cuenta.registrarLoginExitoso();

    const { accessToken, refreshToken, expiresIn } =
      await this.crearNuevaSesion(cuenta, data.userAgent);

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

    const sesion = this.buscarSesionActiva(cuenta, refreshTokenHash);
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

    const fechaExpiracion = await this.calcularFechaExpiracionRefreshToken(
      cuenta.tipoUsuario,
    );

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

    const sesion = this.buscarSesionActiva(cuenta, refreshTokenHash);
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

    const token = this.buscarTokenRecuperacionPendiente(
      cuenta,
      tokenHash,
      TipoTokenRecuperacion.VERIFICACION_EMAIL,
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

    const { token, tokenRecuperacion } = await this.crearTokenRecuperacion(
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

    const cuenta = await this.cuentaRepository.buscarPorTokenHash(tokenHash);
    if (!cuenta) {
      throw new TokenInvalidoError();
    }

    const token = this.buscarTokenRecuperacionPendiente(
      cuenta,
      tokenHash,
      TipoTokenRecuperacion.RECUPERACION_PASSWORD,
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

    const sesionesActivas = this.obtenerSesionesActivasDeCuenta(cuenta);
    this.revocarSesionesActivas(sesionesActivas, 'Recuperación de contraseña');

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

    let sesionesActualizadas: SesionUsuario[] = [];

    if (data.revocarOtrasSesiones) {
      const sesionesActivas = this.obtenerSesionesActivasDeCuenta(cuenta);
      this.revocarSesionesActivas(sesionesActivas, 'Cambio de contraseña');
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

    const sesionesActivas = this.obtenerSesionesActivasDeCuenta(cuenta);
    this.revocarSesionesActivas(
      sesionesActivas,
      'Revocación masiva por usuario',
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

    const sesionesActivas = this.obtenerSesionesActivasDeCuenta(cuenta);

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

  /**
   * Registra intento fallido de login y envía notificación si es bloqueada.
   */
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

  /**
   * Crea nueva sesión con access token y refresh token.
   */
  private async crearNuevaSesion(
    cuenta: CuentaUsuario,
    dispositivo?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const userId = cuenta.propietario.getId();

    const { token: accessToken, expiresIn } =
      await this.jwtService.generateAccessToken(
        cuenta.id,
        userId,
        cuenta.tipoUsuario,
      );

    const refreshToken = this.tokenGenerator.generate();
    const refreshTokenHash = this.tokenGenerator.hash(refreshToken);

    const fechaExpiracion = await this.calcularFechaExpiracionRefreshToken(
      cuenta.tipoUsuario,
    );

    const sesion = SesionUsuarioFactory.crear({
      cuentaUsuarioId: cuenta.id,
      refreshTokenHash,
      dispositivo,
      fechaExpiracion,
    });

    cuenta.agregarSesion(sesion);

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { nuevas: [sesion] },
    });

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Calcula fecha de expiración según tipo de usuario.
   */
  private async calcularFechaExpiracionRefreshToken(
    tipoUsuario: TipoUsuario,
  ): Promise<Date> {
    const ttlHoras =
      tipoUsuario === TipoUsuario.CLIENTE
        ? (await this.configuracionPort.obtenerTTLRefreshTokenClienteDias()) *
          24
        : await this.configuracionPort.obtenerTTLRefreshTokenEmpleadoHoras();

    return new Date(Date.now() + ttlHoras * 60 * 60 * 1000);
  }

  /**
   * Busca sesión activa por refresh token hash.
   */
  private buscarSesionActiva(
    cuenta: CuentaUsuario,
    refreshTokenHash: string,
  ): SesionUsuario | undefined {
    return cuenta.sesiones.find(
      (s) =>
        s.refreshTokenHash === refreshTokenHash &&
        s.estado === EstadoSesion.ACTIVA,
    );
  }

  /**
   * Obtiene todas las sesiones activas de una cuenta.
   */
  private obtenerSesionesActivasDeCuenta(
    cuenta: CuentaUsuario,
  ): SesionUsuario[] {
    return Array.from(cuenta.sesiones).filter(
      (s) => s.estado === EstadoSesion.ACTIVA,
    );
  }

  /**
   * Revoca todas las sesiones activas con un motivo.
   */
  private revocarSesionesActivas(
    sesiones: SesionUsuario[],
    motivo: string,
  ): void {
    sesiones.forEach((s) => s.revocar({ motivo }));
  }

  /**
   * Busca token de recuperación pendiente por hash y tipo.
   */
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

  /**
   * Crea token de recuperación/verificación con fecha de expiración.
   */
  private async crearTokenRecuperacion(
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
