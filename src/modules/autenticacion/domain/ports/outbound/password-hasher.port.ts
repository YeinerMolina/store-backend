export interface PasswordHasher {
  /**
   * Operación computacionalmente costosa (bcrypt cost factor 12).
   */
  hash(plainPassword: string): Promise<string>;

  compare(plainPassword: string, hash: string): Promise<boolean>;
}
