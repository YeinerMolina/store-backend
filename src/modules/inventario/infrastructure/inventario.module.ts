import { Module } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { InventarioApplicationService } from '../application/services/inventario-application.service';
import { InventarioPostgresRepository } from './persistence/repositories/inventario-postgres.repository';
import { ReservaPostgresRepository } from './persistence/repositories/reserva-postgres.repository';
import { MovimientoInventarioPostgresRepository } from './persistence/repositories/movimiento-inventario-postgres.repository';
import { EventBusConsoleAdapter } from './adapters/event-bus-console.adapter';
import { InventarioController } from './controllers/inventario.controller';

@Module({
  providers: [
    PrismaService,
    InventarioPostgresRepository,
    ReservaPostgresRepository,
    MovimientoInventarioPostgresRepository,
    EventBusConsoleAdapter,
    {
      provide: 'INVENTARIO_REPOSITORY',
      useClass: InventarioPostgresRepository,
    },
    {
      provide: 'RESERVA_REPOSITORY',
      useClass: ReservaPostgresRepository,
    },
    {
      provide: 'MOVIMIENTO_INVENTARIO_REPOSITORY',
      useClass: MovimientoInventarioPostgresRepository,
    },
    {
      provide: 'EVENT_BUS_PORT',
      useClass: EventBusConsoleAdapter,
    },
    {
      provide: 'INVENTARIO_SERVICE',
      useFactory: (inventarioRepo, reservaRepo, movimientoRepo, eventBus) => {
        return new InventarioApplicationService(
          inventarioRepo,
          reservaRepo,
          movimientoRepo,
          eventBus,
        );
      },
      inject: [
        'INVENTARIO_REPOSITORY',
        'RESERVA_REPOSITORY',
        'MOVIMIENTO_INVENTARIO_REPOSITORY',
        'EVENT_BUS_PORT',
      ],
    },
  ],
  controllers: [InventarioController],
  exports: ['INVENTARIO_SERVICE'],
})
export class InventarioModule {}
