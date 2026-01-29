export class EntidadDuplicadaError extends Error {
  constructor(entidad: string, identificador: string) {
    super(`${entidad} con identificador '${identificador}' ya existe`);
    this.name = 'EntidadDuplicadaError';
  }
}
