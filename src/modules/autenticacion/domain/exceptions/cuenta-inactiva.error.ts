export class CuentaInactivaError extends Error {
  constructor() {
    super('La cuenta está deshabilitada');
    this.name = 'CuentaInactivaError';
  }
}
