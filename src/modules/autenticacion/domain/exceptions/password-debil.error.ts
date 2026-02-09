export class PasswordDebilError extends Error {
  constructor(public readonly requisitos: string[]) {
    super(
      `La contraseña no cumple con los requisitos: ${requisitos.join(', ')}`,
    );
    this.name = 'PasswordDebilError';
  }
}
