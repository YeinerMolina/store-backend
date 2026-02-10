import { IdGenerator } from '@shared/domain/factories';
import { CuentaUsuario } from '../aggregates/cuenta-usuario/cuenta-usuario.entity';
import { TipoUsuario, EstadoCuenta } from '../aggregates/types';
import type {
  CrearCuentaUsuarioProps,
  CuentaUsuarioProps,
} from '../aggregates/cuenta-usuario/cuenta-usuario.types';

/**
 * Usa UUID v7 para IDs temporalmente ordenados (mejor rendimiento en índices).
 */
export class CuentaUsuarioFactory {
  /**
   * Side effects:
   * - Genera ID con UUID v7
   * - Inicializa fechas de creación y modificación
   */
  static crear(props: CrearCuentaUsuarioProps): CuentaUsuario {
    const ahora = new Date();

    const cuentaProps: CuentaUsuarioProps = {
      id: IdGenerator.generate(),
      email: props.email,
      passwordHash: props.passwordHash,
      tipoUsuario: props.tipoUsuario,
      clienteId: props.clienteId ?? null,
      empleadoId: props.empleadoId ?? null,
      estado:
        props.estado ??
        this.determinarEstadoInicial(props.tipoUsuario, props.emailVerificado),
      emailVerificado: props.emailVerificado ?? false,
      intentosFallidos: 0,
      bloqueadoHasta: null,
      ultimoLogin: null,
      ultimoCambioPassword: null,
      fechaCreacion: ahora,
      fechaModificacion: ahora,
    };

    return CuentaUsuario.desde(cuentaProps);
  }

  /**
   * Determina el estado inicial según tipo de usuario.
   *
   * Clientes: PENDIENTE_VERIFICACION (requieren verificar email)
   * Empleados: ACTIVA (creados por admin, email verificado implícitamente)
   */
  private static determinarEstadoInicial(
    tipoUsuario: TipoUsuario,
    emailVerificado?: boolean,
  ): EstadoCuenta {
    if (tipoUsuario === TipoUsuario.EMPLEADO) {
      return EstadoCuenta.ACTIVA;
    }

    return emailVerificado
      ? EstadoCuenta.ACTIVA
      : EstadoCuenta.PENDIENTE_VERIFICACION;
  }
}
