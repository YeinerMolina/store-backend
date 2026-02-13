import { Inject, Injectable } from '@nestjs/common';
import type { CuentaUsuarioRepository } from '../../../domain/ports/outbound/repositories';
import type { TokenGenerator } from '../../../domain/ports/outbound/external';
import type { JwtService } from '../../../domain/ports/outbound/external';
import type { ConfiguracionPort } from '../../../domain/ports/outbound/integrations';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  TOKEN_GENERATOR_TOKEN,
  JWT_SERVICE_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from '../../../domain/ports/tokens';
import type { CuentaUsuario } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import type { SesionUsuario } from '../../../domain/aggregates/sesion-usuario/sesion-usuario.entity';
import { SesionUsuarioFactory } from '../../../domain/factories/sesion-usuario.factory';
import { TipoUsuario, EstadoSesion } from '../../../domain/aggregates/types';
import { SesionInvalidaError } from '../../../domain/exceptions';
import type {
  CrearSesionResult,
  GenerarSesionResult,
} from '../../../domain/types';

/**
 * Servicio interno para manejo de sesiones de usuario.
 */
@Injectable()
export class SesionManagementService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: TokenGenerator,
    @Inject(JWT_SERVICE_TOKEN)
    private readonly jwtService: JwtService,
    @Inject(CONFIGURACION_PORT_TOKEN)
    private readonly configuracionPort: ConfiguracionPort,
  ) {}

  async crearNuevaSesion(
    cuenta: CuentaUsuario,
    dispositivo?: string,
  ): Promise<CrearSesionResult> {
    const { accessToken, refreshToken, sesion, expiresIn } =
      await this.generarNuevaSesion(cuenta, dispositivo);

    cuenta.agregarSesion(sesion);

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { nuevas: [sesion] },
    });

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Lógica compartida entre login y refreshToken para evitar duplicación.
   * No persiste porque ambos flujos necesitan manejar persistencia diferente:
   * - login: persiste solo sesión nueva
   * - refreshToken: persiste sesión nueva + revoca sesión anterior (transacción atómica)
   */
  async generarNuevaSesion(
    cuenta: CuentaUsuario,
    dispositivo?: string,
  ): Promise<GenerarSesionResult> {
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

    return { accessToken, refreshToken, sesion, expiresIn };
  }

  validarYObtenerSesionActiva(
    cuenta: CuentaUsuario,
    refreshTokenHash: string,
  ): SesionUsuario {
    const sesion = this.buscarSesionActiva(cuenta, refreshTokenHash);
    if (!sesion) {
      throw new SesionInvalidaError();
    }

    if (sesion.verificarExpiracion()) {
      throw new SesionInvalidaError();
    }

    return sesion;
  }

  obtenerSesionesActivasDeCuenta(cuenta: CuentaUsuario): SesionUsuario[] {
    return Array.from(cuenta.sesiones).filter(
      (s) => s.estado === EstadoSesion.ACTIVA,
    );
  }

  revocarSesionesActivas(sesiones: SesionUsuario[], motivo: string): void {
    sesiones.forEach((s) => s.revocar({ motivo }));
  }

  revocarSesionesCondicional(
    cuenta: CuentaUsuario,
    debeRevocar: boolean | undefined,
    motivo: string,
  ): SesionUsuario[] {
    if (!debeRevocar) {
      return [];
    }

    const sesionesActivas = this.obtenerSesionesActivasDeCuenta(cuenta);
    this.revocarSesionesActivas(sesionesActivas, motivo);
    return sesionesActivas;
  }

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
}
