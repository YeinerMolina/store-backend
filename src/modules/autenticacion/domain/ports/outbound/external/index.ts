/**
 * External service ports for technical infrastructure.
 * These ports abstract external dependencies (email, JWT, password hashing, etc).
 */

export * from './email-service.port';
export * from './jwt-service.port';
export * from './password-hasher.port';
export * from './token-generator.port';
