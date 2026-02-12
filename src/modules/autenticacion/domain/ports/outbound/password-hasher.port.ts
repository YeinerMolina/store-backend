/**
 * Puerto para encriptación y verificación de contraseñas.
 * Abstrae el algoritmo de hashing (bcrypt, argon2, etc.).
 */
export interface PasswordHasher {
  /**
   * Side effects:
   * - Operación computacionalmente costosa (bcrypt cost factor 12)
   */
  hash(plainPassword: string): Promise<string>;

  compare(plainPassword: string, hash: string): Promise<boolean>;
}
