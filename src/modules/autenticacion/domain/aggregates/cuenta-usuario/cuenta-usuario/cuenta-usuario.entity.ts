import { TipoUsuario, EstadoCuenta } from '../types';
import type {
  CuentaUsuarioProps,
  CuentaUsuarioData,
  ResultadoAutenticacion,
  OpcionesBloqueo,
} from './cuenta-usuario.types';
import { SesionUsuario } from '../sesion-usuario/sesion-usuario.entity';
import { TokenRecuperacion } from '../token-recuperacion/token-recuperacion.entity';

/**
 * Agregado raíz: CuentaUsuario
 *
 * Gestiona credenciales y control de acceso para clientes y empleados.
 * Un email único global garantiza que no puede existir simultáneamente como cliente y empleado.
 *
 * Invariantes:
 * 1. email único global
 * 2. Exactamente UNO de clienteId o empleadoId debe estar poblado según tipoUsuario
 * 3. intentosFallidos se resetea a 0 en login exitoso
 * 4. estado = BLOQUEADA implica bloqueadoHasta IS NOT NULL
 * 5. emailVerificado = false implica estado = PENDIENTE_VERIFICACION (solo clientes)
 * 6. passwordHash NUNCA se expone fuera del agregado
 */
export class CuentaUsuario {
  private readonly _id: string;
  private readonly _email: string;
  private _passwordHash: string;
  private readonly _tipoUsuario: TipoUsuario;
  private readonly _clienteId: string | null;
  private readonly _empleadoId: string | null;
  private _estado: EstadoCuenta;
  private _emailVerificado: boolean;
  private _intentosFallidos: number;
  private _bloqueadoHasta: Date | null;
  private _ultimoLogin: Date | null;
  private _ultimoCambioPassword: Date | null;
  private readonly _fechaCreacion: Date;
  private _fechaModificacion: Date;

  private _sesiones: SesionUsuario[] = [];
  private _tokensRecuperacion: TokenRecuperacion[] = [];

  private constructor(props: CuentaUsuarioProps) {
    this._id = props.id;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._tipoUsuario = props.tipoUsuario;
    this._clienteId = props.clienteId;
    this._empleadoId = props.empleadoId;
    this._estado = props.estado;
    this._emailVerificado = props.emailVerificado;
    this._intentosFallidos = props.intentosFallidos;
    this._bloqueadoHasta = props.bloqueadoHasta;
    this._ultimoLogin = props.ultimoLogin;
    this._ultimoCambioPassword = props.ultimoCambioPassword;
    this._fechaCreacion = props.fechaCreacion;
    this._fechaModificacion = props.fechaModificacion;

    this.validarInvariantes();
  }

  static reconstituir(props: CuentaUsuarioProps): CuentaUsuario {
    return new CuentaUsuario(props);
  }

  private validarInvariantes(): void {
    if (this._tipoUsuario === TipoUsuario.CLIENTE && !this._clienteId) {
      throw new Error('Cuenta de tipo CLIENTE debe tener clienteId');
    }

    if (this._tipoUsuario === TipoUsuario.EMPLEADO && !this._empleadoId) {
      throw new Error('Cuenta de tipo EMPLEADO debe tener empleadoId');
    }

    if (this._clienteId && this._empleadoId) {
      throw new Error(
        'Una cuenta no puede tener clienteId y empleadoId simultáneamente',
      );
    }

    if (this._estado === EstadoCuenta.BLOQUEADA && !this._bloqueadoHasta) {
      throw new Error('Cuenta bloqueada debe tener fecha de bloqueo');
    }
  }

  /**
   * Verifica si la cuenta puede autenticarse en este momento.
   *
   * Side effects:
   * - No modifica estado, solo consulta
   */
  puedeAutenticarse(): ResultadoAutenticacion {
    if (this._estado === EstadoCuenta.PENDIENTE_VERIFICACION) {
      return {
        exito: false,
        motivoFallo: 'Email no verificado',
      };
    }

    if (this._estado === EstadoCuenta.INACTIVA) {
      return {
        exito: false,
        motivoFallo: 'Cuenta deshabilitada',
      };
    }

    if (this._estado === EstadoCuenta.BLOQUEADA) {
      const ahora = new Date();
      if (this._bloqueadoHasta && this._bloqueadoHasta > ahora) {
        return {
          exito: false,
          motivoFallo: `Cuenta bloqueada hasta ${this._bloqueadoHasta.toISOString()}`,
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
   * Registra un login exitoso.
   *
   * Side effects:
   * - Resetea intentosFallidos a 0
   * - Actualiza ultimoLogin
   * - Actualiza fechaModificacion
   */
  registrarLoginExitoso(): void {
    this._intentosFallidos = 0;
    this._ultimoLogin = new Date();
    this._fechaModificacion = new Date();
  }

  /**
   * Registra un intento de login fallido y aplica bloqueo si alcanza el umbral.
   *
   * Side effects:
   * - Incrementa intentosFallidos
   * - Si alcanza umbral: cambia estado a BLOQUEADA y calcula bloqueadoHasta
   * - Actualiza fechaModificacion
   */
  registrarIntentoFallido(
    maxIntentos: number,
    opcionesBloqueo: OpcionesBloqueo,
  ): void {
    this._intentosFallidos += 1;
    this._fechaModificacion = new Date();

    if (this._intentosFallidos >= maxIntentos) {
      this.bloquearCuenta(opcionesBloqueo);
    }
  }

  /**
   * Bloquea la cuenta calculando duración progresiva.
   *
   * Duración de bloqueo progresivo:
   * - 1er bloqueo: minutosBloqueoInicial (default 5 min)
   * - 2do bloqueo: minutosBloqueoInicial * 3 (default 15 min)
   * - 3er bloqueo: minutosBloqueoInicial * 12 (default 60 min)
   * - 4to+ bloqueo: minutosBloqueoInicial * 288 (default 24 horas)
   */
  private bloquearCuenta(opciones: OpcionesBloqueo): void {
    const { numeroBloqueo, minutosBloqueoInicial } = opciones;

    let minutosBloqueo: number;

    switch (numeroBloqueo) {
      case 1:
        minutosBloqueo = minutosBloqueoInicial;
        break;
      case 2:
        minutosBloqueo = minutosBloqueoInicial * 3;
        break;
      case 3:
        minutosBloqueo = minutosBloqueoInicial * 12;
        break;
      default:
        minutosBloqueo = minutosBloqueoInicial * 288;
    }

    const ahora = new Date();
    this._bloqueadoHasta = new Date(
      ahora.getTime() + minutosBloqueo * 60 * 1000,
    );
    this._estado = EstadoCuenta.BLOQUEADA;
    this._fechaModificacion = new Date();
  }

  /**
   * Desbloquea automáticamente si el tiempo de bloqueo expiró.
   *
   * Side effects:
   * - Cambia estado a ACTIVA si bloqueadoHasta < ahora
   * - Limpia bloqueadoHasta
   * - Resetea intentosFallidos
   */
  private desbloquearAutomaticamente(): void {
    const ahora = new Date();

    if (!this._bloqueadoHasta || this._bloqueadoHasta <= ahora) {
      this._estado = EstadoCuenta.ACTIVA;
      this._bloqueadoHasta = null;
      this._intentosFallidos = 0;
      this._fechaModificacion = new Date();
    }
  }

  /**
   * Desbloquea manualmente la cuenta (acción de admin).
   *
   * Side effects:
   * - Cambia estado a ACTIVA
   * - Limpia bloqueadoHasta
   * - Resetea intentosFallidos
   */
  desbloquearManualmente(): void {
    if (this._estado !== EstadoCuenta.BLOQUEADA) {
      throw new Error('Solo se puede desbloquear una cuenta bloqueada');
    }

    this._estado = EstadoCuenta.ACTIVA;
    this._bloqueadoHasta = null;
    this._intentosFallidos = 0;
    this._fechaModificacion = new Date();
  }

  /**
   * Marca el email como verificado y activa la cuenta.
   *
   * Side effects:
   * - emailVerificado = true
   * - estado = ACTIVA
   */
  verificarEmail(): void {
    if (this._emailVerificado) {
      throw new Error('El email ya está verificado');
    }

    this._emailVerificado = true;
    this._estado = EstadoCuenta.ACTIVA;
    this._fechaModificacion = new Date();
  }

  /**
   * Cambia la contraseña de la cuenta.
   *
   * Side effects:
   * - Actualiza passwordHash
   * - Actualiza ultimoCambioPassword
   * - Si estaba bloqueada, desbloquea
   */
  cambiarPassword(nuevoPasswordHash: string): void {
    this._passwordHash = nuevoPasswordHash;
    this._ultimoCambioPassword = new Date();

    if (this._estado === EstadoCuenta.BLOQUEADA) {
      this._estado = EstadoCuenta.ACTIVA;
      this._bloqueadoHasta = null;
    }

    this._intentosFallidos = 0;
    this._fechaModificacion = new Date();
  }

  inactivar(): void {
    this._estado = EstadoCuenta.INACTIVA;
    this._fechaModificacion = new Date();
  }

  activar(): void {
    if (this._estado !== EstadoCuenta.INACTIVA) {
      throw new Error('Solo se puede activar una cuenta inactiva');
    }

    this._estado = EstadoCuenta.ACTIVA;
    this._fechaModificacion = new Date();
  }

  /**
   * Verifica si la cuenta requiere cambio de contraseña.
   *
   * Reglas:
   * - Primer login (ultimoCambioPassword IS NULL)
   * - Password expirado (empleados: > 90 días)
   */
  requiereCambioPassword(diasExpiracion = 90): boolean {
    if (this._tipoUsuario === TipoUsuario.CLIENTE) {
      return false;
    }

    if (!this._ultimoCambioPassword) {
      return true;
    }

    const ahora = new Date();
    const diasDesdeUltimoCambio =
      (ahora.getTime() - this._ultimoCambioPassword.getTime()) /
      (1000 * 60 * 60 * 24);

    return diasDesdeUltimoCambio > diasExpiracion;
  }

  agregarSesion(sesion: SesionUsuario): void {
    this._sesiones.push(sesion);
  }

  agregarTokenRecuperacion(token: TokenRecuperacion): void {
    this._tokensRecuperacion.push(token);
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get tipoUsuario(): TipoUsuario {
    return this._tipoUsuario;
  }

  get clienteId(): string | null {
    return this._clienteId;
  }

  get empleadoId(): string | null {
    return this._empleadoId;
  }

  get estado(): EstadoCuenta {
    return this._estado;
  }

  get emailVerificado(): boolean {
    return this._emailVerificado;
  }

  get intentosFallidos(): number {
    return this._intentosFallidos;
  }

  get bloqueadoHasta(): Date | null {
    return this._bloqueadoHasta;
  }

  get ultimoLogin(): Date | null {
    return this._ultimoLogin;
  }

  get ultimoCambioPassword(): Date | null {
    return this._ultimoCambioPassword;
  }

  get fechaCreacion(): Date {
    return this._fechaCreacion;
  }

  get fechaModificacion(): Date {
    return this._fechaModificacion;
  }

  get sesiones(): readonly SesionUsuario[] {
    return this._sesiones;
  }

  get tokensRecuperacion(): readonly TokenRecuperacion[] {
    return this._tokensRecuperacion;
  }

  /**
   * Retorna passwordHash SOLO para comparación interna.
   * NUNCA exponer este valor fuera del agregado o capa de dominio.
   */
  getPasswordHashParaComparacion(): string {
    return this._passwordHash;
  }

  toData(): CuentaUsuarioData {
    return {
      id: this._id,
      email: this._email,
      tipoUsuario: this._tipoUsuario,
      clienteId: this._clienteId,
      empleadoId: this._empleadoId,
      estado: this._estado,
      emailVerificado: this._emailVerificado,
      intentosFallidos: this._intentosFallidos,
      bloqueadoHasta: this._bloqueadoHasta,
      ultimoLogin: this._ultimoLogin,
      ultimoCambioPassword: this._ultimoCambioPassword,
      fechaCreacion: this._fechaCreacion,
      fechaModificacion: this._fechaModificacion,
    };
  }
}
