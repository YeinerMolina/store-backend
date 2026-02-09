import type { CuentaUsuario } from '../../aggregates/cuenta-usuario/cuenta-usuario.entity';
import type { SesionUsuario } from '../../aggregates/cuenta-usuario/sesion-usuario.entity';
import type { TokenRecuperacion } from '../../aggregates/cuenta-usuario/token-recuperacion.entity';

/**
 * Puerto outbound: Repository para CuentaUsuario (agregado raíz).
 *
 * Un agregado = un repository.
 * Child entities (SesionUsuario, TokenRecuperacion) se persisten a través de opciones declarativas.
 */

export interface GuardarCuentaUsuarioOptions {
  sesiones?: {
    nuevas?: SesionUsuario[];
    actualizadas?: SesionUsuario[];
    eliminadas?: string[];
  };
  tokensRecuperacion?: {
    nuevos?: TokenRecuperacion[];
    actualizados?: TokenRecuperacion[];
  };
}

export interface CuentaUsuarioRepository {
  /**
   * Guarda una cuenta de usuario (crear o actualizar).
   *
   * Side effects:
   * - Persiste entidades hijas según opciones
   * - Maneja transacción atómica para todo el agregado
   */
  guardar(
    cuenta: CuentaUsuario,
    opciones?: GuardarCuentaUsuarioOptions,
  ): Promise<void>;

  /**
   * Busca cuenta por ID.
   */
  buscarPorId(id: string): Promise<CuentaUsuario | null>;

  /**
   * Busca cuenta por email (único global).
   */
  buscarPorEmail(email: string): Promise<CuentaUsuario | null>;

  /**
   * Busca cuenta por clienteId.
   */
  buscarPorClienteId(clienteId: string): Promise<CuentaUsuario | null>;

  /**
   * Busca cuenta por empleadoId.
   */
  buscarPorEmpleadoId(empleadoId: string): Promise<CuentaUsuario | null>;

  /**
   * Verifica si existe una cuenta con el email dado.
   */
  existePorEmail(email: string): Promise<boolean>;
}
