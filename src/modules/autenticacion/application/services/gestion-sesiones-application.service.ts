import { Injectable } from '@nestjs/common';
import type { GestionSesionesService } from '../../domain/ports/inbound/gestion-sesiones.service';
import type { SesionInfo } from '../../domain/ports/inbound/autenticacion.types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import { Inject } from '@nestjs/common';
import { CUENTA_USUARIO_REPOSITORY_TOKEN } from '../../domain/ports/tokens';
import { EstadoSesion } from '../../domain/aggregates/types';
import { SesionInvalidaError } from '../../domain/exceptions';
import { SesionMapper } from '../mappers/sesion.mapper';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { SesionManagementService } from './internal/sesion-management.service';

@Injectable()
export class GestionSesionesApplicationService implements GestionSesionesService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly sesionManagement: SesionManagementService,
  ) {}

  async revocarTodasLasSesiones(accountId: string): Promise<number> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    const sesionesActivas =
      this.sesionManagement.obtenerSesionesActivasDeCuenta(cuenta);
    this.sesionManagement.revocarSesionesActivas(
      sesionesActivas,
      'Revocación masiva por usuario',
    );

    await this.cuentaRepository.guardar(cuenta, {
      sesiones: { actualizadas: sesionesActivas },
    });

    return sesionesActivas.length;
  }

  async obtenerSesionesActivas(accountId: string): Promise<SesionInfo[]> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

    const sesionesActivas =
      this.sesionManagement.obtenerSesionesActivasDeCuenta(cuenta);

    return sesionesActivas.map((s) => SesionMapper.toSesionInfo(s));
  }

  async revocarSesion(sesionId: string, accountId: string): Promise<void> {
    const cuenta = await this.cuentaValidation.buscarCuentaPorId(accountId);

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
}
