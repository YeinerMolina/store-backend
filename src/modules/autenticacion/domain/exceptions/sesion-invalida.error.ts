export class SesionInvalidaError extends Error {
  constructor(motivo?: string) {
    super(motivo || 'La sesión no es válida o fue revocada');
    this.name = 'SesionInvalidaError';
  }
}
