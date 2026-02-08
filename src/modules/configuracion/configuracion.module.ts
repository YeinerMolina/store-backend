/**
 * CONFIGURACIÓN Module - NestJS Dependency Injection
 *
 * Manages operational parameters and business policies for the system.
 *
 * Dependency Injection Pattern:
 * - Service interface (inbound port) injected into controller
 * - Repository interface (outbound port) injected into service
 * - Token-based providers to avoid string key collisions
 *
 * Exports: Service interface so other modules can import and inject it
 */

import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ConfiguracionController } from './infrastructure/controllers/configuracion.controller';
import { ConfiguracionApplicationService } from './application/services/configuracion-application.service';
import { ConfiguracionPostgresRepository } from './infrastructure/persistence/configuracion-postgres.repository';
import {
  CONFIGURACION_SERVICE_TOKEN,
  CONFIGURACION_REPOSITORY_TOKEN,
} from './domain/ports/tokens';

/**
 * NestJS Module for CONFIGURACIÓN bounded context.
 *
 * Imports:
 * - SharedModule: Provides PrismaService and EventBusModule
 *
 * Providers:
 * - CONFIGURACION_SERVICE_TOKEN → ConfiguracionApplicationService
 * - CONFIGURACION_REPOSITORY_TOKEN → ConfiguracionPostgresRepository
 *
 * Controllers:
 * - ConfiguracionController (HTTP endpoints)
 *
 * Exports:
 * - CONFIGURACION_SERVICE_TOKEN (for injection in other modules)
 */
@Module({
  imports: [SharedModule],
  controllers: [ConfiguracionController],
  providers: [
    {
      provide: CONFIGURACION_SERVICE_TOKEN,
      useClass: ConfiguracionApplicationService,
    },
    {
      provide: CONFIGURACION_REPOSITORY_TOKEN,
      useClass: ConfiguracionPostgresRepository,
    },
  ],
  exports: [CONFIGURACION_SERVICE_TOKEN],
})
export class ConfiguracionModule {}
