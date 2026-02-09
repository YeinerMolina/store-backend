export class TokenExpiradoError extends Error {
  constructor() {
    super('El token ha expirado');
    this.name = 'TokenExpiradoError';
  }
}
