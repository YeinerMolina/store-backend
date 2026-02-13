import { Inject, Injectable } from '@nestjs/common';
import type { RegistroCuentaService } from '../../domain/ports/inbound/registro-cuenta.service';
import type {
  RegistrarClienteData,
  CrearCuentaEmpleadoData,
  CrearCuentaResult,
} from '../../domain/types';
import type { PasswordHasher } from '../../domain/ports/outbound/external';
import type { EmailService } from '../../domain/ports/outbound/external';
import type { ClientePort } from '../../domain/ports/outbound/integrations';
import type { EmpleadoPort } from '../../domain/ports/outbound/integrations';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import type { LogAutenticacionRepository } from '../../domain/ports/outbound/repositories';
import type { TransactionManager } from '@shared/database/ports/transaction-manager.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  LOG_AUTENTICACION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CLIENTE_PORT_TOKEN,
  EMPLEADO_PORT_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../../domain/ports/tokens';
import { CuentaUsuarioFactory } from '../../domain/factories/cuenta-usuario.factory';
import {
  TipoTokenRecuperacion,
  TipoEventoAuth,
  ResultadoAuth,
} from '../../domain/aggregates/types';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { TokenRecoveryService } from './internal/token-recovery.service';
import { LogAutenticacionFactory } from '../../domain/factories';

@Injectable()
export class RegistroCuentaApplicationService implements RegistroCuentaService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(LOG_AUTENTICACION_REPOSITORY_TOKEN)
    private readonly logRepository: LogAutenticacionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: TransactionManager,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(EMAIL_SERVICE_TOKEN)
    private readonly emailService: EmailService,
    @Inject(CLIENTE_PORT_TOKEN)
    private readonly clientePort: ClientePort,
    @Inject(EMPLEADO_PORT_TOKEN)
    private readonly empleadoPort: EmpleadoPort,
    private readonly cuentaValidation: CuentaValidationService,
    private readonly tokenRecovery: TokenRecoveryService,
  ) {}

  async registrarCliente(
    data: RegistrarClienteData,
  ): Promise<CrearCuentaResult> {
    await this.cuentaValidation.validarEmailNoExiste(data.email);

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

    const token = await this.guardarCuentaConTokenVerificacion(cuenta);

    await this.emailService.enviarEmailVerificacion(
      data.email,
      data.nombre,
      token,
    );

    return { accountId: cuenta.id };
  }

  async crearCuentaEmpleado(
    data: CrearCuentaEmpleadoData,
    empleadoId: string,
  ): Promise<CrearCuentaResult> {
    await this.cuentaValidation.validarEmailNoExiste(data.email);
    await this.cuentaValidation.validarEmpleadoExiste(data.empleadoId);

    const passwordHash = await this.passwordHasher.hash(data.temporaryPassword);

    const cuenta = CuentaUsuarioFactory.crearCuentaEmpleado({
      email: data.email,
      passwordHash,
      empleadoId: data.empleadoId,
    });

    const log = LogAutenticacionFactory.crear({
      emailIntento: data.email,
      cuentaUsuarioId: cuenta.id,
      tipoEvento: TipoEventoAuth.CREACION_CUENTA_EMPLEADO,
      resultado: ResultadoAuth.EXITOSO,
      metadata: {
        admin_id: empleadoId,
        empleado_id: data.empleadoId,
      },
    });

    await this.transactionManager.transaction(async (tx) => {
      await this.cuentaRepository.guardar(cuenta, { transactionContext: tx });
      await this.logRepository.guardar(log, tx);
    });

    const empleado = await this.empleadoPort.buscarPorId(data.empleadoId);

    await this.emailService.enviarEmailCuentaEmpleadoCreada(
      data.email,
      empleado?.nombre ?? '',
      data.temporaryPassword,
    );

    return { accountId: cuenta.id };
  }

  private async guardarCuentaConTokenVerificacion(
    cuenta: import('../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity').CuentaUsuario,
  ): Promise<string> {
    const { token, tokenRecuperacion } =
      await this.tokenRecovery.crearTokenRecuperacion(
        cuenta.id,
        TipoTokenRecuperacion.VERIFICACION_EMAIL,
      );

    cuenta.agregarTokenRecuperacion(tokenRecuperacion);

    await this.cuentaRepository.guardar(cuenta, {
      tokensRecuperacion: { nuevos: [tokenRecuperacion] },
    });

    return token;
  }
}
