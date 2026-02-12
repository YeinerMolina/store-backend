import { TipoUsuario } from '../aggregates/types';
import { validate as uuidValidate } from 'uuid';

interface PropietarioCuentaProps {
  tipo: TipoUsuario;
  id: string;
}

/**
 * Value Object que encapsula la relación exclusiva entre una cuenta
 * y su propietario (Cliente o Empleado).
 *
 * Garantiza que una cuenta pertenece a UN SOLO tipo de usuario mediante
 * factory methods específicos, eliminando la necesidad de validaciones
 * condicionales en el código cliente.
 *
 * Razón de existencia:
 * - Previene estados inválidos (una cuenta con ambos IDs o sin ninguno)
 * - Encapsula la lógica de discriminación de tipo
 * - Proporciona API type-safe para acceso al ID del propietario
 */
export class PropietarioCuenta {
  private readonly tipo: TipoUsuario;
  private readonly id: string;

  private constructor(props: PropietarioCuentaProps) {
    if (!uuidValidate(props.id)) {
      throw new Error(
        `ID de propietario inválido: ${props.id}. Debe ser un UUID válido.`,
      );
    }

    this.tipo = props.tipo;
    this.id = props.id;
  }

  static desdeCliente(clienteId: string): PropietarioCuenta {
    return new PropietarioCuenta({
      tipo: TipoUsuario.CLIENTE,
      id: clienteId,
    });
  }

  static desdeEmpleado(empleadoId: string): PropietarioCuenta {
    return new PropietarioCuenta({
      tipo: TipoUsuario.EMPLEADO,
      id: empleadoId,
    });
  }

  static desde(tipo: TipoUsuario, id: string): PropietarioCuenta {
    return new PropietarioCuenta({ tipo, id });
  }

  getTipo(): TipoUsuario {
    return this.tipo;
  }

  getId(): string {
    return this.id;
  }

  esCliente(): boolean {
    return this.tipo === TipoUsuario.CLIENTE;
  }

  esEmpleado(): boolean {
    return this.tipo === TipoUsuario.EMPLEADO;
  }

  /**
   * Retorna clienteId solo si es una cuenta de cliente, null en caso contrario.
   * Útil para mantener compatibilidad con código existente que espera campos separados.
   */
  getClienteId(): string | null {
    return this.esCliente() ? this.id : null;
  }

  /**
   * Retorna empleadoId solo si es una cuenta de empleado, null en caso contrario.
   * Útil para mantener compatibilidad con código existente que espera campos separados.
   */
  getEmpleadoId(): string | null {
    return this.esEmpleado() ? this.id : null;
  }

  equals(other: PropietarioCuenta): boolean {
    return this.tipo === other.tipo && this.id === other.id;
  }

  toString(): string {
    return `${this.tipo}:${this.id}`;
  }
}
