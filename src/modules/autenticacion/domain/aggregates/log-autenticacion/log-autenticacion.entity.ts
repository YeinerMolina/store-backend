import type { TipoEventoAuth, ResultadoAuth } from '../types';
import type { LogAutenticacionProps } from './log-autenticacion.types';

/**
 * Aggregate inmutable de auditoría (INSERT-only).
 * Registra todos los eventos de autenticación exitosos y fallidos.
 *
 * Invariantes:
 * - Inmutable después de creación (no métodos de modificación)
 * - emailIntento siempre presente (incluso si cuenta no existe)
 * - cuentaUsuarioId puede ser null (intentos con email inexistente)
 */
export class LogAutenticacion {
  readonly #id: string;
  readonly #emailIntento: string;
  readonly #cuentaUsuarioId: string | null;
  readonly #tipoEvento: TipoEventoAuth;
  readonly #resultado: ResultadoAuth;
  readonly #motivoFallo: string | null;
  readonly #userAgent: string | null;
  readonly #metadata: Record<string, unknown> | null;
  readonly #fechaEvento: Date;

  get id(): string {
    return this.#id;
  }

  get emailIntento(): string {
    return this.#emailIntento;
  }

  get cuentaUsuarioId(): string | null {
    return this.#cuentaUsuarioId;
  }

  get tipoEvento(): TipoEventoAuth {
    return this.#tipoEvento;
  }

  get resultado(): ResultadoAuth {
    return this.#resultado;
  }

  get motivoFallo(): string | null {
    return this.#motivoFallo;
  }

  get userAgent(): string | null {
    return this.#userAgent;
  }

  get metadata(): Record<string, unknown> | null {
    return this.#metadata;
  }

  get fechaEvento(): Date {
    return this.#fechaEvento;
  }

  private constructor(props: LogAutenticacionProps) {
    this.#id = props.id;
    this.#emailIntento = props.emailIntento;
    this.#cuentaUsuarioId = props.cuentaUsuarioId;
    this.#tipoEvento = props.tipoEvento;
    this.#resultado = props.resultado;
    this.#motivoFallo = props.motivoFallo;
    this.#userAgent = props.userAgent;
    this.#metadata = props.metadata;
    this.#fechaEvento = props.fechaEvento;
  }

  static desde(props: LogAutenticacionProps): LogAutenticacion {
    return new LogAutenticacion(props);
  }
}
