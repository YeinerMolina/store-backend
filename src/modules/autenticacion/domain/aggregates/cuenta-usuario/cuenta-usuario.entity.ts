import { TipoUsuario, EstadoCuenta } from '../types';
import type {
  CuentaUsuarioProps,
  ResultadoAutenticacion,
  OpcionesBloqueo,
} from './cuenta-usuario.types';
import { SesionUsuario } from '../sesion-usuario/sesion-usuario.entity';
import { TokenRecuperacion } from '../token-recuperacion/token-recuperacion.entity';

/**
 * Aggregate root para cuentas de usuario (clientes y empleados).
 *
 * Invariantes:
 * - CLIENTE requiere clienteId, EMPLEADO requiere empleadoId (nunca ambos)
 * - Estado BLOQUEADA requiere bloqueadoHasta definido
 * - Password hash nunca se expone fuera del aggregate (encapsulación de secretos)
 */
export class CuentaUsuario {
  readonly #id: string;
  readonly #email: string;
  #passwordHash: string;
  readonly #tipoUsuario: TipoUsuario;
  readonly #clienteId: string | null;
  readonly #empleadoId: string | null;
  #estado: EstadoCuenta;
  #emailVerificado: boolean;
  #intentosFallidos: number;
  #bloqueadoHasta: Date | null;
  #ultimoLogin: Date | null;
  #ultimoCambioPassword: Date | null;
  readonly #fechaCreacion: Date;
  #fechaModificacion: Date;

  #sesiones: SesionUsuario[] = [];
  #tokensRecuperacion: TokenRecuperacion[] = [];

  get id(): string {
    return this.#id;
  }

  get email(): string {
    return this.#email;
  }

  get tipoUsuario(): TipoUsuario {
    return this.#tipoUsuario;
  }

  get clienteId(): string | null {
    return this.#clienteId;
  }

  get empleadoId(): string | null {
    return this.#empleadoId;
  }

  get estado(): EstadoCuenta {
    return this.#estado;
  }

  get emailVerificado(): boolean {
    return this.#emailVerificado;
  }

  get intentosFallidos(): number {
    return this.#intentosFallidos;
  }

  get bloqueadoHasta(): Date | null {
    return this.#bloqueadoHasta;
  }

  get ultimoLogin(): Date | null {
    return this.#ultimoLogin;
  }

  get ultimoCambioPassword(): Date | null {
    return this.#ultimoCambioPassword;
  }

  get fechaCreacion(): Date {
    return this.#fechaCreacion;
  }

  get fechaModificacion(): Date {
    return this.#fechaModificacion;
  }

  get sesiones(): readonly SesionUsuario[] {
    return this.#sesiones;
  }

  get tokensRecuperacion(): readonly TokenRecuperacion[] {
    return this.#tokensRecuperacion;
  }

  private constructor(props: CuentaUsuarioProps) {
    this.#id = props.id;
    this.#email = props.email;
    this.#passwordHash = props.passwordHash;
    this.#tipoUsuario = props.tipoUsuario;
    this.#clienteId = props.clienteId;
    this.#empleadoId = props.empleadoId;
    this.#estado = props.estado;
    this.#emailVerificado = props.emailVerificado;
    this.#intentosFallidos = props.intentosFallidos;
    this.#bloqueadoHasta = props.bloqueadoHasta;
    this.#ultimoLogin = props.ultimoLogin;
    this.#ultimoCambioPassword = props.ultimoCambioPassword;
    this.#fechaCreacion = props.fechaCreacion;
    this.#fechaModificacion = props.fechaModificacion;

    this.validarInvariantes();
  }

  static reconstituir(props: CuentaUsuarioProps): CuentaUsuario {
    return new CuentaUsuario(props);
  }

  private validarInvariantes(): void {
    if (this.#tipoUsuario === TipoUsuario.CLIENTE && !this.#clienteId) {
      throw new Error('Cuenta de tipo CLIENTE debe tener clienteId');
    }

    if (this.#tipoUsuario === TipoUsuario.EMPLEADO && !this.#empleadoId) {
      throw new Error('Cuenta de tipo EMPLEADO debe tener empleadoId');
    }

    if (this.#clienteId && this.#empleadoId) {
      throw new Error(
        'Una cuenta no puede tener clienteId y empleadoId simultáneamente',
      );
    }

    if (this.#estado === EstadoCuenta.BLOQUEADA && !this.#bloqueadoHasta) {
      throw new Error('Cuenta bloqueada debe tener fecha de bloqueo');
    }
  }

  /**
   * Side effects:
   * - Si estado es BLOQUEADA y expiró el tiempo, desbloquea automáticamente
   */
  puedeAutenticarse(): ResultadoAutenticacion {
    if (this.#estado === EstadoCuenta.PENDIENTE_VERIFICACION) {
      return {
        exito: false,
        motivoFallo: 'Email no verificado',
      };
    }

    if (this.#estado === EstadoCuenta.INACTIVA) {
      return {
        exito: false,
        motivoFallo: 'Cuenta deshabilitada',
      };
    }

    if (this.#estado === EstadoCuenta.BLOQUEADA) {
      const ahora = new Date();
      if (this.#bloqueadoHasta && this.#bloqueadoHasta > ahora) {
        return {
          exito: false,
          motivoFallo: `Cuenta bloqueada hasta ${this.#bloqueadoHasta.toISOString()}`,
        };
      }

      this.desbloquearAutomaticamente();
    }

    if (this.requiereCambioPassword()) {
      return {
        exito: true,
        requiereCambioPassword: true,
      };
    }

    return { exito: true };
  }

  /**
   * Mantiene el password hash encapsulado dentro del aggregate.
   * Sigue el principio "Tell, Don't Ask" para proteger secretos del dominio.
   */
  verificarPassword(passwordHash: string): boolean {
    return this.#passwordHash === passwordHash;
  }

  registrarLoginExitoso(): void {
    this.#intentosFallidos = 0;
    this.#ultimoLogin = new Date();
    this.#fechaModificacion = new Date();
  }

  /**
   * Side effects:
   * - Si alcanza maxIntentos, bloquea la cuenta automáticamente
   */
  registrarIntentoFallido(
    maxIntentos: number,
    opcionesBloqueo: OpcionesBloqueo,
  ): void {
    this.#intentosFallidos += 1;
    this.#fechaModificacion = new Date();

    if (this.#intentosFallidos >= maxIntentos) {
      this.bloquearCuenta(opcionesBloqueo);
    }
  }

  /**
   * Usa backoff exponencial para penalizar intentos repetidos:
   * - 1er bloqueo: tiempo base
   * - 2do bloqueo: 3x tiempo base
   * - 3er bloqueo: 12x tiempo base
   * - 4to+ bloqueo: 288x tiempo base (2 días si base = 10 min)
   */
  private calcularMinutosBloqueo(
    numeroBloqueo: number,
    minutosBloqueoInicial: number,
  ): number {
    if (numeroBloqueo === 1) {
      return minutosBloqueoInicial;
    }

    if (numeroBloqueo === 2) {
      return minutosBloqueoInicial * 3;
    }

    if (numeroBloqueo === 3) {
      return minutosBloqueoInicial * 12;
    }

    return minutosBloqueoInicial * 288;
  }

  private bloquearCuenta(opciones: OpcionesBloqueo): void {
    const { numeroBloqueo, minutosBloqueoInicial } = opciones;
    const minutosBloqueo = this.calcularMinutosBloqueo(
      numeroBloqueo,
      minutosBloqueoInicial,
    );

    const ahora = new Date();
    this.#bloqueadoHasta = new Date(
      ahora.getTime() + minutosBloqueo * 60 * 1000,
    );
    this.#estado = EstadoCuenta.BLOQUEADA;
    this.#fechaModificacion = new Date();
  }

  private desbloquearAutomaticamente(): void {
    const ahora = new Date();

    if (!this.#bloqueadoHasta || this.#bloqueadoHasta <= ahora) {
      this.#estado = EstadoCuenta.ACTIVA;
      this.#bloqueadoHasta = null;
      this.#intentosFallidos = 0;
      this.#fechaModificacion = new Date();
    }
  }

  desbloquearManualmente(): void {
    if (this.#estado !== EstadoCuenta.BLOQUEADA) {
      throw new Error('Solo se puede desbloquear una cuenta bloqueada');
    }

    this.#estado = EstadoCuenta.ACTIVA;
    this.#bloqueadoHasta = null;
    this.#intentosFallidos = 0;
    this.#fechaModificacion = new Date();
  }

  /**
   * Side effects:
   * - Cambia estado de PENDIENTE_VERIFICACION a ACTIVA
   */
  verificarEmail(): void {
    if (this.#emailVerificado) {
      throw new Error('El email ya está verificado');
    }

    this.#emailVerificado = true;
    this.#estado = EstadoCuenta.ACTIVA;
    this.#fechaModificacion = new Date();
  }

  /**
   * Side effects:
   * - Si cuenta estaba BLOQUEADA, la desbloquea automáticamente
   * - Resetea intentos fallidos
   */
  cambiarPassword(nuevoPasswordHash: string): void {
    this.#passwordHash = nuevoPasswordHash;
    this.#ultimoCambioPassword = new Date();

    if (this.#estado === EstadoCuenta.BLOQUEADA) {
      this.#estado = EstadoCuenta.ACTIVA;
      this.#bloqueadoHasta = null;
    }

    this.#intentosFallidos = 0;
    this.#fechaModificacion = new Date();
  }

  inactivar(): void {
    this.#estado = EstadoCuenta.INACTIVA;
    this.#fechaModificacion = new Date();
  }

  activar(): void {
    if (this.#estado !== EstadoCuenta.INACTIVA) {
      throw new Error('Solo se puede activar una cuenta inactiva');
    }

    this.#estado = EstadoCuenta.ACTIVA;
    this.#fechaModificacion = new Date();
  }

  /**
   * Los clientes nunca requieren cambio de password.
   * Los empleados deben cambiar password cada 90 días (configurable).
   */
  requiereCambioPassword(diasExpiracion = 90): boolean {
    if (this.#tipoUsuario === TipoUsuario.CLIENTE) {
      return false;
    }

    if (!this.#ultimoCambioPassword) {
      return true;
    }

    const ahora = new Date();
    const diasDesdeUltimoCambio =
      (ahora.getTime() - this.#ultimoCambioPassword.getTime()) /
      (1000 * 60 * 60 * 24);

    return diasDesdeUltimoCambio > diasExpiracion;
  }

  agregarSesion(sesion: SesionUsuario): void {
    this.#sesiones.push(sesion);
  }

  agregarTokenRecuperacion(token: TokenRecuperacion): void {
    this.#tokensRecuperacion.push(token);
  }
}
