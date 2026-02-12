/**
 * Puerto para generación y hash de tokens opacos.
 * Tokens usados para recuperación de password y verificación de email.
 */
export interface TokenGenerator {
  /**
   * Genera token opaco (UUID v4).
   */
  generate(): string;

  /**
   * Hashea token para almacenamiento seguro (SHA-256).
   */
  hash(token: string): string;
}
