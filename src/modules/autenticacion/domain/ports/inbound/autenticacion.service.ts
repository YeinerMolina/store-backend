import type {
  RegistrarClienteData,
  LoginData,
  LoginResult,
  RefreshTokenData,
  VerificarEmailData,
  SolicitarRecuperacionData,
  EjecutarRecuperacionData,
  CambiarPasswordData,
  CrearCuentaEmpleadoData,
  SesionInfo,
  InformacionCuenta,
} from './autenticacion.types';

/**
 * Puerto inbound para autenticación y gestión de cuentas.
 * Define TODOS los casos de uso del módulo sin implementación.
 */
export interface AutenticacionService {
  /**
   * Side effects:
   * - Crea Cliente en módulo IDENTIDAD
   * - Genera token de verificación de email
   * - Envía email de verificación vía COMUNICACION
   */
  registrarCliente(data: RegistrarClienteData): Promise<{ accountId: string }>;

  /**
   * Side effects:
   * - Actualiza ultimo_login y resetea intentos_fallidos si exitoso
   * - Incrementa intentos_fallidos y puede bloquear cuenta si falla
   * - Crea sesión activa con refresh token hasheado
   * - Emite LoginExitoso o LoginFallido
   */
  login(data: LoginData): Promise<LoginResult>;

  /**
   * Rotación automática: invalida refresh token anterior.
   *
   * Side effects:
   * - Actualiza sesión con nuevo refresh_token_hash
   * - Extiende fecha_expiracion de la sesión
   */
  refreshToken(data: RefreshTokenData): Promise<LoginResult>;

  /**
   * Side effects:
   * - Revoca sesión (estado = REVOCADA)
   */
  logout(refreshToken: string): Promise<void>;

  /**
   * Side effects:
   * - Marca email_verificado = true
   * - Cambia estado de PENDIENTE_VERIFICACION a ACTIVA
   * - Marca token como USADO
   */
  verificarEmail(data: VerificarEmailData): Promise<void>;

  /**
   * Side effects:
   * - Genera token de recuperación con expiración de 1 hora
   * - Envía email con link de reset
   */
  solicitarRecuperacionPassword(data: SolicitarRecuperacionData): Promise<void>;

  /**
   * Side effects:
   * - Actualiza password_hash con nuevo bcrypt hash
   * - Revoca TODAS las sesiones activas (forzar re-login)
   * - Marca token como USADO
   * - Desbloquea cuenta si estaba bloqueada
   */
  ejecutarRecuperacionPassword(data: EjecutarRecuperacionData): Promise<void>;

  /**
   * Requiere autenticación previa (usuario debe proporcionar contraseña actual).
   *
   * Side effects:
   * - Actualiza password_hash
   * - Opcionalmente revoca otras sesiones
   */
  cambiarPassword(accountId: string, data: CambiarPasswordData): Promise<void>;

  /**
   * Solo ejecutable por admin/empleado con permiso.
   *
   * Side effects:
   * - Crea cuenta con estado ACTIVA y email_verificado = true
   * - ultimo_cambio_password = NULL (forzará cambio en primer login)
   * - Envía email con instrucciones de primer login
   */
  crearCuentaEmpleado(
    data: CrearCuentaEmpleadoData,
  ): Promise<{ accountId: string }>;

  /**
   * Solo ejecutable por admin.
   *
   * Side effects:
   * - Cambia estado a ACTIVA
   * - Resetea intentos_fallidos y bloqueado_hasta
   */
  desbloquearCuenta(accountId: string, adminId: string): Promise<void>;

  /**
   * Side effects:
   * - Revoca TODAS las sesiones activas del usuario
   */
  revocarTodasLasSesiones(accountId: string): Promise<number>;

  obtenerSesionesActivas(accountId: string): Promise<SesionInfo[]>;

  revocarSesion(sesionId: string, accountId: string): Promise<void>;

  obtenerInformacionCuenta(accountId: string): Promise<InformacionCuenta>;
}
