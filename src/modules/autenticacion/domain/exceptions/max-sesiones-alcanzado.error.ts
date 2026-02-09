export class MaxSesionesAlcanzadoError extends Error {
  constructor(maxSesiones: number) {
    super(`Se alcanzó el límite de ${maxSesiones} sesiones activas`);
    this.name = 'MaxSesionesAlcanzadoError';
  }
}
