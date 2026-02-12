/**
 * Request DTOs (con validación Zod)
 */
export {
  registrarClienteRequestSchema,
  type RegistrarClienteRequestDto,
} from './registrar-cliente-request.schema';

export {
  loginRequestSchema,
  type LoginRequestDto,
} from './login-request.schema';

export {
  refreshTokenRequestSchema,
  type RefreshTokenRequestDto,
} from './refresh-token-request.schema';

export {
  verificarEmailRequestSchema,
  type VerificarEmailRequestDto,
} from './verificar-email-request.schema';

export {
  solicitarRecuperacionRequestSchema,
  type SolicitarRecuperacionRequestDto,
} from './solicitar-recuperacion-request.schema';

export {
  ejecutarRecuperacionRequestSchema,
  type EjecutarRecuperacionRequestDto,
} from './ejecutar-recuperacion-request.schema';

export {
  cambiarPasswordRequestSchema,
  type CambiarPasswordRequestDto,
} from './cambiar-password-request.schema';

export {
  crearCuentaEmpleadoRequestSchema,
  type CrearCuentaEmpleadoRequestDto,
} from './crear-cuenta-empleado-request.schema';

/**
 * Response DTOs (interfaces simples, sin validación)
 */
export type { LoginResponseDto } from './login-response.dto';
export type { SesionResponseDto } from './sesion-response.dto';
export type { CuentaInfoResponseDto } from './cuenta-info-response.dto';
