export class TokenYaUsadoError extends Error {
  constructor() {
    super('El token ya fue utilizado');
    this.name = 'TokenYaUsadoError';
  }
}
