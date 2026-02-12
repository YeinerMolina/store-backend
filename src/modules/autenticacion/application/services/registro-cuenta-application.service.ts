import { Inject, Injectable } from '@nestjs/common';
import type { RegistroCuentaService } from '../../domain/ports/inbound/registro-cuenta.service';
import type {
  RegistrarClienteData,
  CrearCuentaEmpleadoData,
} from '../../domain/ports/inbound/autenticacion.types';
import type { PasswordHasher } from '../../domain/ports/outbound/password-hasher.port';
import type { EmailService } from '../../domain/ports/outbound/email-service.port';
import type { ClientePort } from '../../domain/ports/outbound/cliente.port';
import type { EmpleadoPort } from '../../domain/ports/outbound/empleado.port';
import type { CuentaUsuarioRepository } from '../../domain/ports/outbound/cuenta-usuario.repository';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  EMAIL_SERVICE_TOKEN,
  CLIENTE_PORT_TOKEN,
  EMPLEADO_PORT_TOKEN,
} from '../../domain/ports/tokens';
import { CuentaUsuarioFactory } from '../../domain/factories/cuenta-usuario.factory';
import { TipoTokenRecuperacion } from '../../domain/aggregates/types';
import { CuentaValidationService } from './internal/cuenta-validation.service';
import { TokenRecoveryService } from './internal/token-recovery.service';

@Injectable()
export class RegistroCuentaApplicationService implements RegistroCuentaService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
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
  ): Promise<{ accountId: string }> {
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
  ): Promise<{ accountId: string }> {
    await this.cuentaValidation.validarEmailNoExiste(data.email);
    await this.cuentaValidation.validarEmpleadoExiste(data.empleadoId);

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
