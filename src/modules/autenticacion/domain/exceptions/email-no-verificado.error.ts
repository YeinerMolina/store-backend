export class EmailNoVerificadoError extends Error {
  constructor() {
    super('El email no ha sido verificado');
    this.name = 'EmailNoVerificadoError';
  }
}
