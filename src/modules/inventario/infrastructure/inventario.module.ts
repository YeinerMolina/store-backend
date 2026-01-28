import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { InventarioApplicationService } from '../application/services/inventario-application.service';
import { InventarioPostgresRepository } from './persistence/repositories/inventario-postgres.repository';
import { EventBusConsoleAdapter } from './adapters/event-bus-console.adapter';
import { InventarioController } from './controllers/inventario.controller';
import {
  INVENTARIO_SERVICE_TOKEN,
  INVENTARIO_REPOSITORY_TOKEN,
  EVENT_BUS_PORT_TOKEN,
} from '../domain/ports/tokens';

/**
 * Single repository enforces DDD aggregate boundaries: all internal
 * entities (Reserva, MovimientoInventario) must go through Inventario.
 */
@Module({
  providers: [
    PrismaService,
    InventarioPostgresRepository,
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
      provide: INVENTARIO_SERVICE_TOKEN,
      useFactory: (inventarioRepo, eventBus) => {
        return new InventarioApplicationService(inventarioRepo, eventBus);
      },
      inject: [INVENTARIO_REPOSITORY_TOKEN, EVENT_BUS_PORT_TOKEN],
    },
  ],
  controllers: [InventarioController],
  exports: [INVENTARIO_SERVICE_TOKEN],
})
export class InventarioModule {}
