import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { InventarioApplicationService } from '../application/services/inventario-application.service';
import { InventarioPostgresRepository } from './persistence/repositories/inventario-postgres.repository';
import { PrismaTransactionManager } from './persistence/prisma-transaction-manager';
import { InventarioController } from './controllers/inventario.controller';
import { InventarioJobsService } from './jobs/inventario-jobs.service';
import { ConfiguracionStubAdapter } from './adapters/configuracion-stub.adapter';
import {
  INVENTARIO_SERVICE_TOKEN,
  INVENTARIO_REPOSITORY_TOKEN,
  EVENT_BUS_PORT_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
  CONFIGURACION_PORT_TOKEN,
} from '../domain/ports/tokens';

/**
 * Inventario module - complete DDD aggregate with full lifecycle management.
 *
 * Imports:
 * - SharedModule: Provides PrismaService and EventBusModule
 *
 * Architecture:
 * - Single repository enforces DDD aggregate boundaries: all internal
 *   entities (Reserva, MovimientoInventario) must go through Inventario root
 * - Event-driven: publishes domain events via EVENT_BUS_PORT_TOKEN
 * - Transaction management: coordinates multi-table operations
 */
@Module({
  imports: [SharedModule],
  providers: [
    InventarioPostgresRepository,
    PrismaTransactionManager,
    InventarioJobsService,
    {
      provide: INVENTARIO_REPOSITORY_TOKEN,
      useClass: InventarioPostgresRepository,
    },
    {
      provide: TRANSACTION_MANAGER_TOKEN,
      useClass: PrismaTransactionManager,
    },
    {
      provide: CONFIGURACION_PORT_TOKEN,
      useClass: ConfiguracionStubAdapter,
    },
    {
      provide: INVENTARIO_SERVICE_TOKEN,
      useFactory: (
        inventarioRepo,
        eventBus,
        transactionManager,
        configuracionPort,
      ) => {
        return new InventarioApplicationService(
          inventarioRepo,
          eventBus,
          transactionManager,
          configuracionPort,
        );
      },
      inject: [
        INVENTARIO_REPOSITORY_TOKEN,
        EVENT_BUS_PORT_TOKEN,
        TRANSACTION_MANAGER_TOKEN,
        CONFIGURACION_PORT_TOKEN,
      ],
    },
  ],
  controllers: [InventarioController],
  exports: [INVENTARIO_SERVICE_TOKEN],
})
export class InventarioModule {}
