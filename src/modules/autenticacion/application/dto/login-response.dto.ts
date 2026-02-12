export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userType: string;
  userId: string;
  requiereCambioPassword?: boolean;
}
