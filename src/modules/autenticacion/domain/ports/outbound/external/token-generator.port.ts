export interface TokenGenerator {
  /**
   * Usa UUID v4 porque los tokens son descartables y no necesitan orden temporal.
   */
  generate(): string;

  /**
   * SHA-256 para almacenamiento seguro sin reversión.
   */
  hash(token: string): string;
}
