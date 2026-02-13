import { TipoUsuario } from '../../../aggregates';

export interface JwtPayload {
  type: 'access';
  userType: TipoUsuario;
  userId: string;
  accountId: string;
  iat: number;
  exp: number;
}

export interface JwtService {
  /**
   * Genera access token JWT firmado con clave privada.
   *
   * Side effects:
   * - TTL depende del tipo de usuario (cliente: 15min, empleado: 30min)
   */
  generateAccessToken(
    accountId: string,
    userId: string,
    userType: TipoUsuario,
  ): Promise<{ token: string; expiresIn: number }>;

  /**
   * Verifica firma y expiración del token.
   *
   * @throws {InvalidTokenError} Si el token es inválido o expiró
   */
  verifyAccessToken(token: string): Promise<JwtPayload>;
}
