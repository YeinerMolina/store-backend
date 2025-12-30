import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from 'eventemitter2';
import { InventoryController } from './presentation/inventory.controller';
import { AdjustInventoryService } from './application/services/adjust-inventory.service';
import { TypeOrmInventoryRepository } from './infrastructure/persistence/inventory-item.repository';
import { InventoryItemSchema } from './infrastructure/persistence/inventory-item.schema';
import { INVENTORY_REPOSITORY_TOKEN } from './domain/inventory.repository';
import { EventEmitterAdapter } from '../../shared/adapters/event-emitter.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItemSchema])],
  controllers: [InventoryController],
  providers: [
    AdjustInventoryService,
    {
      provide: INVENTORY_REPOSITORY_TOKEN,
      useClass: TypeOrmInventoryRepository,
    },
    {
      provide: 'EventPublisher',
      useValue: new EventEmitterAdapter(new EventEmitter2()),
    },
  ],
  exports: [INVENTORY_REPOSITORY_TOKEN, AdjustInventoryService],
})
export class InventoryModule {}
