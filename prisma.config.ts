/**
 * PRISMA 7+ CONFIGURATION
 *
 * En Prisma 7, la configuración de datasource se movió de schema.prisma
 * a este archivo prisma.config.ts
 *
 * IMPORTANTE: El schema se regenera automáticamente desde prisma/schemas/
 * usando el script merge-schemas.js
 *
 * Ver: https://pris.ly/d/config-datasource
 */

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
