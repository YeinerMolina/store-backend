import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from './modules/inventory/inventory.module';
import { InventoryItemSchema } from './modules/inventory/infrastructure/persistence/inventory-item.schema';

/**
 * Root Module
 * Orquesta todos los módulos de la aplicación
 */
@Module({
  imports: [
    // Event emitter para comunicación asíncrona
    EventEmitterModule.forRoot(),

    // TypeORM configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'store_db',
      entities: [InventoryItemSchema],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),

    // Application modules
    InventoryModule,
    // OrdersModule (próximo)
    // CustomersModule (próximo)
    // PaymentsModule (próximo)
  ],
})
export class AppModule {}
