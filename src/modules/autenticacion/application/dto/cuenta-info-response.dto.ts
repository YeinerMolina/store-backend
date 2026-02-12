export interface CuentaInfoResponseDto {
  accountId: string;
  email: string;
  tipoUsuario: string;
  userId: string;
  emailVerificado: boolean;
  ultimoLogin: string | null;
}
