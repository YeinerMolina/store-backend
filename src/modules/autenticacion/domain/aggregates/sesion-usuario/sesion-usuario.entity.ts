import { EstadoSesion } from '../types';
import type {
  SesionUsuarioProps,
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
  readonly #id: string;
  readonly #cuentaUsuarioId: string;
  readonly #refreshTokenHash: string;
  readonly #dispositivo: string | null;
  readonly #ipAddress: string | null;
  readonly #ubicacion: string | null;
  #estado: EstadoSesion;
  readonly #fechaCreacion: Date;
  readonly #fechaExpiracion: Date;
  #fechaUltimoUso: Date | null;
  #fechaRevocacion: Date | null;
  #revocadaPor: string | null;
  #motivoRevocacion: string | null;

  get id(): string {
    return this.#id;
  }

  get cuentaUsuarioId(): string {
    return this.#cuentaUsuarioId;
  }

  get dispositivo(): string | null {
    return this.#dispositivo;
  }

  get ipAddress(): string | null {
    return this.#ipAddress;
  }

  get ubicacion(): string | null {
    return this.#ubicacion;
  }

  get estado(): EstadoSesion {
    return this.#estado;
  }

  get fechaCreacion(): Date {
    return this.#fechaCreacion;
  }

  get fechaExpiracion(): Date {
    return this.#fechaExpiracion;
  }

  get fechaUltimoUso(): Date | null {
    return this.#fechaUltimoUso;
  }

  get fechaRevocacion(): Date | null {
    return this.#fechaRevocacion;
  }

  get revocadaPor(): string | null {
    return this.#revocadaPor;
  }

  get motivoRevocacion(): string | null {
    return this.#motivoRevocacion;
  }

  private constructor(props: SesionUsuarioProps) {
    this.#id = props.id;
    this.#cuentaUsuarioId = props.cuentaUsuarioId;
    this.#refreshTokenHash = props.refreshTokenHash;
    this.#dispositivo = props.dispositivo;
    this.#ipAddress = props.ipAddress;
    this.#ubicacion = props.ubicacion;
    this.#estado = props.estado;
    this.#fechaCreacion = props.fechaCreacion;
    this.#fechaExpiracion = props.fechaExpiracion;
    this.#fechaUltimoUso = props.fechaUltimoUso;
    this.#fechaRevocacion = props.fechaRevocacion;
    this.#revocadaPor = props.revocadaPor;
    this.#motivoRevocacion = props.motivoRevocacion;
  }

  static reconstituir(props: SesionUsuarioProps): SesionUsuario {
    return new SesionUsuario(props);
  }

  estaActiva(): boolean {
    if (this.#estado !== EstadoSesion.ACTIVA) {
      return false;
    }

    const ahora = new Date();
    return this.#fechaExpiracion > ahora;
  }

  /**
   * Side effects:
   * - Si expiró y estado es ACTIVA, cambia a EXPIRADA automáticamente
   */
  verificarExpiracion(): boolean {
    const ahora = new Date();

    if (
      this.#fechaExpiracion <= ahora &&
      this.#estado === EstadoSesion.ACTIVA
    ) {
      this.#estado = EstadoSesion.EXPIRADA;
      return true;
    }

    return this.#estado === EstadoSesion.EXPIRADA;
  }

  /**
   * Mantiene el refresh token hash encapsulado dentro del aggregate.
   * Sigue el principio "Tell, Don't Ask" para proteger secretos del dominio.
   */
  verificarRefreshToken(refreshTokenHash: string): boolean {
    return this.#refreshTokenHash === refreshTokenHash;
  }

  registrarUso(): void {
    if (!this.estaActiva()) {
      throw new Error('No se puede usar una sesión inactiva o expirada');
    }

    this.#fechaUltimoUso = new Date();
  }

  /**
   * Side effects:
   * - Registra metadata de auditoría (quién, cuándo, por qué)
   */
  revocar(opciones: OpcionesRevocacion): void {
    if (this.#estado === EstadoSesion.REVOCADA) {
      throw new Error('La sesión ya está revocada');
    }

    this.#estado = EstadoSesion.REVOCADA;
    this.#fechaRevocacion = new Date();
    this.#revocadaPor = opciones.revocadaPor ?? null;
    this.#motivoRevocacion = opciones.motivo;
  }
}
