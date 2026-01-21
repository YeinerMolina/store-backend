import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { InventarioApplicationService } from '../application/services/inventario-application.service';
import { InventarioPostgresRepository } from './persistence/repositories/inventario-postgres.repository';
import { ReservaPostgresRepository } from './persistence/repositories/reserva-postgres.repository';
import { MovimientoInventarioPostgresRepository } from './persistence/repositories/movimiento-inventario-postgres.repository';
import { EventBusConsoleAdapter } from './adapters/event-bus-console.adapter';
import { InventarioController } from './controllers/inventario.controller';

// Tokens de inyección de dependencias
import {
  INVENTARIO_SERVICE_TOKEN,
  INVENTARIO_REPOSITORY_TOKEN,
  RESERVA_REPOSITORY_TOKEN,
  MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN,
  EVENT_BUS_PORT_TOKEN,
} from '../domain/ports/tokens';

@Module({
  providers: [
    PrismaService,
    InventarioPostgresRepository,
    ReservaPostgresRepository,
    MovimientoInventarioPostgresRepository,
    EventBusConsoleAdapter,
    {
      provide: INVENTARIO_REPOSITORY_TOKEN,
      useClass: InventarioPostgresRepository,
    },
    {
      provide: RESERVA_REPOSITORY_TOKEN,
      useClass: ReservaPostgresRepository,
    },
    {
      provide: MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN,
      useClass: MovimientoInventarioPostgresRepository,
    },
    {
      provide: EVENT_BUS_PORT_TOKEN,
      useClass: EventBusConsoleAdapter,
    },
    {
      provide: INVENTARIO_SERVICE_TOKEN,
      useFactory: (inventarioRepo, reservaRepo, movimientoRepo, eventBus) => {
        return new InventarioApplicationService(
          inventarioRepo,
          reservaRepo,
          movimientoRepo,
          eventBus,
        );
      },
      inject: [
        INVENTARIO_REPOSITORY_TOKEN,
        RESERVA_REPOSITORY_TOKEN,
        MOVIMIENTO_INVENTARIO_REPOSITORY_TOKEN,
        EVENT_BUS_PORT_TOKEN,
      ],
    },
  ],
  controllers: [InventarioController],
  exports: [INVENTARIO_SERVICE_TOKEN],
})
export class InventarioModule {}
