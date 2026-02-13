import { Injectable, Inject } from '@nestjs/common';
import type { GestionSesionesService } from '../../domain/ports/inbound/gestion-sesiones.service';
import type { SesionInfo } from '../../domain/types';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { TransactionManager } from '@shared/database/ports/transaction-manager.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import {
  EstadoSesion,
  TipoEventoAuth,
  ResultadoAuth,
} from '../../domain/aggregates/types';
import { SesionInvalidaError } from '../../domain/exceptions';
import { SesionMapper } from '../mappers/sesion.mapper';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { SesionManagementService } from './internal/sesion-management.service';
import { LogAutenticacionFactory } from '../../domain/factories';

@Injectable()
export class GestionSesionesApplicationService implements GestionSesionesService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(LOG_AUTENTICACION_REPOSITORY_TOKEN)
    private readonly logRepository: LogAutenticacionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
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

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.REVOCACION_MASIVA,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        sesiones_revocadas: sesionesActivas.length,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, {
        sesiones: { actualizadas: sesionesActivas },
        transactionContext: tx,
      });
      await this.logRepository.guardar(log, tx);
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

    const log = LogAutenticacionFactory.crear({
      emailIntento: cuenta.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.REVOCACION_SESION,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        sesion_id: sesionId,
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
}
