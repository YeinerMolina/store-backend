import { EstadoSesion } from '../types';
import type {
  SesionUsuarioProps,
  SesionUsuarioData,
  OpcionesRevocacion,
} from './sesion-usuario.types';

/**
 * Entidad hija: SesionUsuario
 *
 * Representa una sesión activa con refresh token.
 * Pertenece al agregado CuentaUsuario.
 *
 * Invariantes:
 * - refreshTokenHash es inmutable una vez creado (rotación crea nueva sesión)
 * - Una sesión REVOCADA no puede volver a ACTIVA
 * - fechaExpiracion es inmutable
 */
export class SesionUsuario {
  private readonly _id: string;
  private readonly _cuentaUsuarioId: string;
  private readonly _refreshTokenHash: string;
  private readonly _dispositivo: string | null;
  private readonly _ipAddress: string | null;
  private readonly _ubicacion: string | null;
  private _estado: EstadoSesion;
  private readonly _fechaCreacion: Date;
  private readonly _fechaExpiracion: Date;
  private _fechaUltimoUso: Date | null;
  private _fechaRevocacion: Date | null;
  private _revocadaPor: string | null;
  private _motivoRevocacion: string | null;

  private constructor(props: SesionUsuarioProps) {
    this._id = props.id;
    this._cuentaUsuarioId = props.cuentaUsuarioId;
    this._refreshTokenHash = props.refreshTokenHash;
    this._dispositivo = props.dispositivo;
    this._ipAddress = props.ipAddress;
    this._ubicacion = props.ubicacion;
    this._estado = props.estado;
    this._fechaCreacion = props.fechaCreacion;
    this._fechaExpiracion = props.fechaExpiracion;
    this._fechaUltimoUso = props.fechaUltimoUso;
    this._fechaRevocacion = props.fechaRevocacion;
    this._revocadaPor = props.revocadaPor;
    this._motivoRevocacion = props.motivoRevocacion;
  }

  static reconstituir(props: SesionUsuarioProps): SesionUsuario {
    return new SesionUsuario(props);
  }

  estaActiva(): boolean {
    if (this._estado !== EstadoSesion.ACTIVA) {
      return false;
    }

    const ahora = new Date();
    return this._fechaExpiracion > ahora;
  }

  /**
   * Verifica si la sesión expiró por tiempo.
   *
   * Side effects:
   * - Si expiró y estado es ACTIVA, cambia a EXPIRADA
   */
  verificarExpiracion(): boolean {
    const ahora = new Date();

    if (
      this._fechaExpiracion <= ahora &&
      this._estado === EstadoSesion.ACTIVA
    ) {
      this._estado = EstadoSesion.EXPIRADA;
      return true;
    }

    return this._estado === EstadoSesion.EXPIRADA;
  }

  /**
   * Registra el uso del refresh token.
   *
   * Side effects:
   * - Actualiza fechaUltimoUso
   */
  registrarUso(): void {
    if (!this.estaActiva()) {
      throw new Error('No se puede usar una sesión inactiva o expirada');
    }

    this._fechaUltimoUso = new Date();
  }

  /**
   * Revoca la sesión.
   *
   * Side effects:
   * - Cambia estado a REVOCADA
   * - Registra fechaRevocacion, revocadaPor y motivo
   */
  revocar(opciones: OpcionesRevocacion): void {
    if (this._estado === EstadoSesion.REVOCADA) {
      throw new Error('La sesión ya está revocada');
    }

    this._estado = EstadoSesion.REVOCADA;
    this._fechaRevocacion = new Date();
    this._revocadaPor = opciones.revocadaPor ?? null;
    this._motivoRevocacion = opciones.motivo;
  }

  get id(): string {
    return this._id;
  }

  get cuentaUsuarioId(): string {
    return this._cuentaUsuarioId;
  }

  get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }

  get dispositivo(): string | null {
    return this._dispositivo;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get ubicacion(): string | null {
    return this._ubicacion;
  }

  get estado(): EstadoSesion {
    return this._estado;
  }

  get fechaCreacion(): Date {
    return this._fechaCreacion;
  }

  get fechaExpiracion(): Date {
    return this._fechaExpiracion;
  }

  get fechaUltimoUso(): Date | null {
    return this._fechaUltimoUso;
  }

  get fechaRevocacion(): Date | null {
    return this._fechaRevocacion;
  }

  get revocadaPor(): string | null {
    return this._revocadaPor;
  }

  get motivoRevocacion(): string | null {
    return this._motivoRevocacion;
  }

  toData(): SesionUsuarioData {
    return {
      id: this._id,
      cuentaUsuarioId: this._cuentaUsuarioId,
      dispositivo: this._dispositivo,
      ipAddress: this._ipAddress,
      ubicacion: this._ubicacion,
      estado: this._estado,
      fechaCreacion: this._fechaCreacion,
      fechaExpiracion: this._fechaExpiracion,
      fechaUltimoUso: this._fechaUltimoUso,
    };
  }
}
