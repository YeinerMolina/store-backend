import type { CuentaUsuario } from '../../aggregates/cuenta-usuario/cuenta-usuario.entity';
import type { GuardarCuentaUsuarioOptions } from '../../aggregates/cuenta-usuario/cuenta-usuario.types';

/**
 * Un agregado = un repository (regla DDD).
 * Child entities (SesionUsuario, TokenRecuperacion) se persisten a través de opciones declarativas.
 */

export interface CuentaUsuarioRepository {
  /**
   * Side effects:
   * - Persiste entidades hijas según opciones
   * - Maneja transacción atómica para todo el agregado
   */
  guardar(
    cuenta: CuentaUsuario,
    opciones?: GuardarCuentaUsuarioOptions,
  ): Promise<void>;

  buscarPorId(id: string): Promise<CuentaUsuario | null>;

  /**
   * Email es único global (constraint del dominio).
   */
  buscarPorEmail(email: string): Promise<CuentaUsuario | null>;

  buscarPorClienteId(clienteId: string): Promise<CuentaUsuario | null>;

  buscarPorEmpleadoId(empleadoId: string): Promise<CuentaUsuario | null>;

  existePorEmail(email: string): Promise<boolean>;
}
