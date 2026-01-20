import { Module } from '@nestjs/common';

// Application Layer
import { VentaService } from './application/services/venta.service';

// Infrastructure Layer - Persistence
import { PrismaVentaRepository } from './infrastructure/persistence/prisma-venta.repository';

// Infrastructure Layer - Adapters
import { InventarioAdapter } from './infrastructure/adapters/inventario.adapter';
import { CatalogoAdapter } from './infrastructure/adapters/catalogo.adapter';
import { EventBusAdapter } from './infrastructure/adapters/event-bus.adapter';

// Infrastructure Layer - Controllers
import { VentaController } from './infrastructure/controllers/venta.controller';

/**
 * MÓDULO COMERCIAL
 * Configuración de inyección de dependencias hexagonal
 *
 * IMPORTANTE - Inyección de Puertos:
 * 1. Los servicios de aplicación dependen de INTERFACES (puertos)
 * 2. En runtime, NestJS inyecta las IMPLEMENTACIONES (adaptadores)
 * 3. Esto permite cambiar implementaciones sin tocar el dominio
 */
@Module({
  controllers: [VentaController],
  providers: [
    // Application Services (implementan puertos inbound)
    {
      provide: 'IVentaService',
      useClass: VentaService,
    },

    // Outbound Adapters (implementan puertos outbound)
    {
      provide: 'IVentaRepository',
      useClass: PrismaVentaRepository,
    },
    {
      provide: 'IInventarioPort',
      useClass: InventarioAdapter,
    },
    {
      provide: 'ICatalogoPort',
      useClass: CatalogoAdapter,
    },
    {
      provide: 'IEventBusPort',
      useClass: EventBusAdapter,
    },

    // TODO: Agregar PrismaClient cuando se configure Prisma
  ],
  exports: ['IVentaService'], // Exportar para otros módulos
})
export class ComercialModule {}
