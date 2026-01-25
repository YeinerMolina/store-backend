import { EnvKeys } from './env.keys.js';

export function isProduction(): boolean {
  return process.env[EnvKeys.NODE_ENV] === 'production';
}

export function isDevelopment(): boolean {
  return process.env[EnvKeys.NODE_ENV] === 'development';
}

export function getPort(): number {
  return Number(process.env[EnvKeys.PORT]);
}
