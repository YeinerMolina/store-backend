import { Inject, Injectable } from '@nestjs/common';
import type { CuentaUsuarioRepository } from '../../../domain/ports/outbound/cuenta-usuario.repository';
import type { PasswordHasher } from '../../../domain/ports/outbound/password-hasher.port';
import type { EmpleadoPort } from '../../../domain/ports/outbound/empleado.port';
import {
  CUENTA_USUARIO_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  EMPLEADO_PORT_TOKEN,
} from '../../../domain/ports/tokens';
import type { CuentaUsuario } from '../../../domain/aggregates/cuenta-usuario/cuenta-usuario.entity';
import {
  EmailYaExisteError,
  CuentaNoEncontradaError,
  CredencialesInvalidasError,
} from '../../../domain/exceptions';

/**
 * Servicio interno para validaciones comunes de cuentas.
 * No es un puerto público, solo reutilización de código entre servicios.
 */
@Injectable()
export class CuentaValidationService {
  constructor(
    @Inject(CUENTA_USUARIO_REPOSITORY_TOKEN)
    private readonly cuentaRepository: CuentaUsuarioRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(EMPLEADO_PORT_TOKEN)
    private readonly empleadoPort: EmpleadoPort,
  ) {}

  async validarEmailNoExiste(email: string): Promise<void> {
    const emailExiste = await this.cuentaRepository.existePorEmail(email);
    if (emailExiste) {
      throw new EmailYaExisteError(email);
    }
  }

  async validarEmpleadoExiste(empleadoId: string): Promise<void> {
    const empleadoExiste = await this.empleadoPort.existePorId(empleadoId);
    if (!empleadoExiste) {
      throw new Error('Empleado no encontrado');
    }
  }

  validarCuentaPuedeAutenticarse(cuenta: CuentaUsuario): void {
    const resultadoAuth = cuenta.puedeAutenticarse();
    if (!resultadoAuth.exito && resultadoAuth.error) {
      throw resultadoAuth.error;
    }
  }

  async validarPasswordActual(
    password: string,
    cuenta: CuentaUsuario,
  ): Promise<void> {
    const passwordValido = await this.passwordHasher.compare(
      password,
      cuenta.passwordHash,
    );

    if (!passwordValido) {
      throw new CredencialesInvalidasError();
    }
  }

  async buscarCuentaPorId(accountId: string): Promise<CuentaUsuario> {
    const cuenta = await this.cuentaRepository.buscarPorId(accountId);
    if (!cuenta) {
      throw new CuentaNoEncontradaError(accountId);
    }
    return cuenta;
  }
}
