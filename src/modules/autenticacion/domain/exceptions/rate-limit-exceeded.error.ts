export class RateLimitExceededError extends Error {
  constructor(operacion: string, reintentoEn?: number) {
    const mensaje = reintentoEn
      ? `Demasiados intentos de ${operacion}. Reintente en ${reintentoEn} segundos`
      : `Demasiados intentos de ${operacion}`;

    super(mensaje);
    this.name = 'RateLimitExceededError';
  }
}
