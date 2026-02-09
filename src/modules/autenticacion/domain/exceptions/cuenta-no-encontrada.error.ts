export class CuentaNoEncontradaError extends Error {
  constructor(identificador: string) {
    super(`No se encontró la cuenta: ${identificador}`);
    this.name = 'CuentaNoEncontradaError';
  }
}
