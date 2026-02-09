import { TipoTokenRecuperacion, EstadoToken } from '../types';
import type {
  TokenRecuperacionProps,
  OpcionesUsoToken,
} from './token-recuperacion.types';

/**
 * Entidad hija: TokenRecuperacion
 *
 * Representa un token temporal para recuperación de password o verificación de email.
 * Pertenece al agregado CuentaUsuario.
 *
 * Invariantes:
 * - tokenHash es inmutable
 * - Un token USADO no puede volver a PENDIENTE
 * - fechaExpiracion es inmutable
 */
export class TokenRecuperacion {
  readonly #id: string;
  readonly #cuentaUsuarioId: string;
  readonly #tipoToken: TipoTokenRecuperacion;
  readonly #tokenHash: string;
  #estado: EstadoToken;
  readonly #fechaCreacion: Date;
  readonly #fechaExpiracion: Date;
  #fechaUso: Date | null;
  readonly #ipSolicitud: string | null;
  #ipUso: string | null;

  get id(): string {
    return this.#id;
  }

  get cuentaUsuarioId(): string {
    return this.#cuentaUsuarioId;
  }

  get tipoToken(): TipoTokenRecuperacion {
    return this.#tipoToken;
  }

  get estado(): EstadoToken {
    return this.#estado;
  }

  get fechaCreacion(): Date {
    return this.#fechaCreacion;
  }

  get fechaExpiracion(): Date {
    return this.#fechaExpiracion;
  }

  get fechaUso(): Date | null {
    return this.#fechaUso;
  }

  get ipSolicitud(): string | null {
    return this.#ipSolicitud;
  }

  get ipUso(): string | null {
    return this.#ipUso;
  }

  private constructor(props: TokenRecuperacionProps) {
    this.#id = props.id;
    this.#cuentaUsuarioId = props.cuentaUsuarioId;
    this.#tipoToken = props.tipoToken;
    this.#tokenHash = props.tokenHash;
    this.#estado = props.estado;
    this.#fechaCreacion = props.fechaCreacion;
    this.#fechaExpiracion = props.fechaExpiracion;
    this.#fechaUso = props.fechaUso;
    this.#ipSolicitud = props.ipSolicitud;
    this.#ipUso = props.ipUso;
  }

  static reconstituir(props: TokenRecuperacionProps): TokenRecuperacion {
    return new TokenRecuperacion(props);
  }

  esValido(): boolean {
    if (this.#estado !== EstadoToken.PENDIENTE) {
      return false;
    }

    const ahora = new Date();
    return this.#fechaExpiracion > ahora;
  }

  /**
   * Side effects:
   * - Si expiró y estado es PENDIENTE, cambia a EXPIRADO automáticamente
   */
  verificarExpiracion(): boolean {
    const ahora = new Date();

    if (
      this.#fechaExpiracion <= ahora &&
      this.#estado === EstadoToken.PENDIENTE
    ) {
      this.#estado = EstadoToken.EXPIRADO;
      return true;
    }

    return this.#estado === EstadoToken.EXPIRADO;
  }

  /**
   * Mantiene el token hash encapsulado dentro del aggregate.
   * Sigue el principio "Tell, Don't Ask" para proteger secretos del dominio.
   */
  verificarToken(tokenHash: string): boolean {
    return this.#tokenHash === tokenHash;
  }

  /**
   * Validates token state before marking as used.
   * Uses early returns to avoid nested conditionals.
   */
  private validarEstadoParaUso(): void {
    if (this.#estado === EstadoToken.USADO) {
      throw new Error('El token ya fue usado');
    }

    if (this.#estado === EstadoToken.EXPIRADO) {
      throw new Error('No se puede usar un token expirado');
    }

    if (this.#estado === EstadoToken.INVALIDADO) {
      throw new Error('No se puede usar un token invalidado');
    }

    if (!this.esValido()) {
      throw new Error('El token no es válido');
    }
  }

  /**
   * Side effects:
   * - Registra metadata de auditoría (cuándo y desde qué IP se usó)
   */
  marcarComoUsado(opciones?: OpcionesUsoToken): void {
    this.validarEstadoParaUso();

    this.#estado = EstadoToken.USADO;
    this.#fechaUso = new Date();
    this.#ipUso = opciones?.ipUso ?? null;
  }

  invalidar(): void {
    if (this.#estado !== EstadoToken.PENDIENTE) {
      throw new Error('Solo se puede invalidar un token pendiente');
    }

    this.#estado = EstadoToken.INVALIDADO;
  }
}
