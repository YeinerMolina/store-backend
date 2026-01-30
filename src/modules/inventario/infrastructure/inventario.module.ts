import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { InventarioApplicationService } from '../application/services/inventario-application.service';
import { InventarioPostgresRepository } from './persistence/repositories/inventario-postgres.repository';
import { PrismaTransactionManager } from './persistence/prisma-transaction-manager';
import { EventBusConsoleAdapter } from './adapters/event-bus-console.adapter';
import { InventarioController } from './controllers/inventario.controller';
import {
  INVENTARIO_SERVICE_TOKEN,
  INVENTARIO_REPOSITORY_TOKEN,
  EVENT_BUS_PORT_TOKEN,
  TRANSACTION_MANAGER_TOKEN,
} from '../domain/ports/tokens';

/**
 * Single repository enforces DDD aggregate boundaries: all internal
 * entities (Reserva, MovimientoInventario) must go through Inventario.
 */
@Module({
  providers: [
    PrismaService,
    InventarioPostgresRepository,
    PrismaTransactionManager,
    EventBusConsoleAdapter,
    {
      provide: INVENTARIO_REPOSITORY_TOKEN,
      useClass: InventarioPostgresRepository,
    },
    {
      provide: EVENT_BUS_PORT_TOKEN,
      useClass: EventBusConsoleAdapter,
    },
    {
      provide: TRANSACTION_MANAGER_TOKEN,
      useClass: PrismaTransactionManager,
    },
    {
      provide: INVENTARIO_SERVICE_TOKEN,
      useFactory: (inventarioRepo, eventBus, transactionManager) => {
        return new InventarioApplicationService(
          inventarioRepo,
          eventBus,
          transactionManager,
        );
      },
      inject: [
        INVENTARIO_REPOSITORY_TOKEN,
        EVENT_BUS_PORT_TOKEN,
        TRANSACTION_MANAGER_TOKEN,
      ],
    },
  ],
  controllers: [InventarioController],
  exports: [INVENTARIO_SERVICE_TOKEN],
})
export class InventarioModule {}
