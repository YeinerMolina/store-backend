import type { LogAutenticacion } from '../../../aggregates/log-autenticacion/log-autenticacion.entity';
import type { TransactionContext } from '@shared/database';

/**
 * INSERT-only: logs son inmutables para auditoría forense.
 * TransactionContext garantiza atomicidad con CuentaUsuario
 * (ambos se persisten o ambos fallan).
 */
export interface LogAutenticacionRepository {
  /**
   * Side effect: ejecuta INSERT dentro de transacción externa si ctx presente,
   * o crea nueva transacción si ctx ausente.
   */
  guardar(log: LogAutenticacion, ctx?: TransactionContext): Promise<void>;

  buscarPorId(
    id: string,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion | null>;

  buscarPorCuentaUsuarioId(
    cuentaUsuarioId: string,
    limite?: number,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion[]>;

  buscarPorEmail(
    email: string,
    limite?: number,
    ctx?: TransactionContext,
  ): Promise<LogAutenticacion[]>;
}
