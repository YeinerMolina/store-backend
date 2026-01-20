import { Module } from '@nestjs/common';

// Application Layer
import { VentaApplicationService } from './application/services/venta-application.service';

// Infrastructure Layer - Persistence
import { VentaRepositoryPostgres } from './infrastructure/persistence/venta-repository-postgres';

// Infrastructure Layer - Adapters
import { InventarioHttpAdapter } from './infrastructure/adapters/inventario-http.adapter';
import { CatalogoHttpAdapter } from './infrastructure/adapters/catalogo-http.adapter';
import { EventBusRedisAdapter } from './infrastructure/adapters/event-bus-redis.adapter';

// Infrastructure Layer - Controllers
import { VentaController } from './infrastructure/controllers/venta.controller';

// Tokens para inyección de dependencias
export const VENTA_SERVICE = 'VentaService';
export const VENTA_REPOSITORY = 'VentaRepository';
export const INVENTARIO_PORT = 'InventarioPort';
export const CATALOGO_PORT = 'CatalogoPort';
export const EVENT_BUS_PORT = 'EventBusPort';

/**
 * MÓDULO COMERCIAL
 * Configuración de inyección de dependencias hexagonal
 *
 * IMPORTANTE - Inyección de Puertos:
 * 1. Los servicios de aplicación dependen de INTERFACES (puertos)
 * 2. En runtime, NestJS inyecta las IMPLEMENTACIONES (adaptadores)
 * 3. Esto permite cambiar implementaciones sin tocar el dominio
 *
 * CONVENCIÓN DE NOMBRES:
 * - Puerto (interface): VentaRepository, InventarioPort
 * - Implementación: VentaRepositoryPostgres, InventarioHttpAdapter
 * - Token DI: String descriptivo ('VentaRepository', 'InventarioPort')
 */
@Module({
  controllers: [VentaController],
  providers: [
    // ========================================
    // PUERTOS INBOUND → IMPLEMENTACIONES
    // ========================================
    {
      provide: VENTA_SERVICE,
      useClass: VentaApplicationService,
    },

    // ========================================
    // PUERTOS OUTBOUND → IMPLEMENTACIONES
    // ========================================

    // Persistencia
    {
      provide: VENTA_REPOSITORY,
      useClass: VentaRepositoryPostgres,
      // Cambiar implementación sin tocar dominio:
      // useClass: VentaRepositoryMongo,
      // useClass: VentaRepositoryInMemory, // para tests
    },

    // Comunicación con otros módulos
    {
      provide: INVENTARIO_PORT,
      useClass: InventarioHttpAdapter,
      // Cambiar implementación:
      // useClass: InventarioEventAdapter,
      // useClass: InventarioInProcessAdapter,
    },
    {
      provide: CATALOGO_PORT,
      useClass: CatalogoHttpAdapter,
      // Cambiar implementación:
      // useClass: CatalogoEventAdapter,
      // useClass: CatalogoInProcessAdapter,
    },

    // Event Bus
    {
      provide: EVENT_BUS_PORT,
      useClass: EventBusRedisAdapter,
      // Cambiar implementación:
      // useClass: EventBusRabbitMQAdapter,
      // useClass: EventBusKafkaAdapter,
      // useClass: EventBusInMemoryAdapter, // para tests
    },

    // TODO: Agregar PrismaClient cuando se configure Prisma
    // {
    //   provide: PrismaClient,
    //   useValue: new PrismaClient(),
    // },
  ],
  exports: [
    VENTA_SERVICE, // Exportar para que otros módulos lo usen
  ],
})
export class ComercialModule {}
