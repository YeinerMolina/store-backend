export class CuentaBloqueadaError extends Error {
  constructor(public readonly bloqueadoHasta: Date) {
    super(`Cuenta bloqueada hasta ${bloqueadoHasta.toISOString()}`);
    this.name = 'CuentaBloqueadaError';
  }
}
