import { z } from 'zod';

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.uuid({ error: 'Refresh token inválido' }),
});

export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;
