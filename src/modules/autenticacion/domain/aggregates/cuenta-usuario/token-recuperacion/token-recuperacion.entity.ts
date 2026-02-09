import { TipoTokenRecuperacion, EstadoToken } from '../types';
import type {
  TokenRecuperacionProps,
  TokenRecuperacionData,
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
  private readonly _id: string;
  private readonly _cuentaUsuarioId: string;
  private readonly _tipoToken: TipoTokenRecuperacion;
  private readonly _tokenHash: string;
  private _estado: EstadoToken;
  private readonly _fechaCreacion: Date;
  private readonly _fechaExpiracion: Date;
  private _fechaUso: Date | null;
  private readonly _ipSolicitud: string | null;
  private _ipUso: string | null;

  private constructor(props: TokenRecuperacionProps) {
    this._id = props.id;
    this._cuentaUsuarioId = props.cuentaUsuarioId;
    this._tipoToken = props.tipoToken;
    this._tokenHash = props.tokenHash;
    this._estado = props.estado;
    this._fechaCreacion = props.fechaCreacion;
    this._fechaExpiracion = props.fechaExpiracion;
    this._fechaUso = props.fechaUso;
    this._ipSolicitud = props.ipSolicitud;
    this._ipUso = props.ipUso;
  }

  static reconstituir(props: TokenRecuperacionProps): TokenRecuperacion {
    return new TokenRecuperacion(props);
  }

  esValido(): boolean {
    if (this._estado !== EstadoToken.PENDIENTE) {
      return false;
    }

    const ahora = new Date();
    return this._fechaExpiracion > ahora;
  }

  /**
   * Verifica si el token expiró por tiempo.
   *
   * Side effects:
   * - Si expiró y estado es PENDIENTE, cambia a EXPIRADO
   */
  verificarExpiracion(): boolean {
    const ahora = new Date();

    if (
      this._fechaExpiracion <= ahora &&
      this._estado === EstadoToken.PENDIENTE
    ) {
      this._estado = EstadoToken.EXPIRADO;
      return true;
    }

    return this._estado === EstadoToken.EXPIRADO;
  }

  /**
   * Marca el token como usado.
   *
   * Side effects:
   * - Cambia estado a USADO
   * - Registra fechaUso e ipUso
   */
  marcarComoUsado(opciones?: OpcionesUsoToken): void {
    if (this._estado === EstadoToken.USADO) {
      throw new Error('El token ya fue usado');
    }

    if (this._estado === EstadoToken.EXPIRADO) {
      throw new Error('No se puede usar un token expirado');
    }

    if (this._estado === EstadoToken.INVALIDADO) {
      throw new Error('No se puede usar un token invalidado');
    }

    if (!this.esValido()) {
      throw new Error('El token no es válido');
    }

    this._estado = EstadoToken.USADO;
    this._fechaUso = new Date();
    this._ipUso = opciones?.ipUso ?? null;
  }

  invalidar(): void {
    if (this._estado !== EstadoToken.PENDIENTE) {
      throw new Error('Solo se puede invalidar un token pendiente');
    }

    this._estado = EstadoToken.INVALIDADO;
  }

  get id(): string {
    return this._id;
  }

  get cuentaUsuarioId(): string {
    return this._cuentaUsuarioId;
  }

  get tipoToken(): TipoTokenRecuperacion {
    return this._tipoToken;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get estado(): EstadoToken {
    return this._estado;
  }

  get fechaCreacion(): Date {
    return this._fechaCreacion;
  }

  get fechaExpiracion(): Date {
    return this._fechaExpiracion;
  }

  get fechaUso(): Date | null {
    return this._fechaUso;
  }

  get ipSolicitud(): string | null {
    return this._ipSolicitud;
  }

  get ipUso(): string | null {
    return this._ipUso;
  }

  toData(): TokenRecuperacionData {
    return {
      id: this._id,
      cuentaUsuarioId: this._cuentaUsuarioId,
      tipoToken: this._tipoToken,
      estado: this._estado,
      fechaCreacion: this._fechaCreacion,
      fechaExpiracion: this._fechaExpiracion,
      fechaUso: this._fechaUso,
    };
  }
}
