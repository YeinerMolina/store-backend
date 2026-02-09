export class TokenInvalidoError extends Error {
  constructor(motivo?: string) {
    super(motivo || 'Token inválido o no existe');
    this.name = 'TokenInvalidoError';
  }
}
