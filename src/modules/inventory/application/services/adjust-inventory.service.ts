import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryRepository } from '../../domain/inventory.repository';
import { INVENTORY_REPOSITORY_TOKEN } from '../../domain/inventory.repository';
import { NotFoundException } from '../../../../shared/domain/exceptions/domain.exception';
import { Quantity } from '../../domain/inventory-item.entity';
import type { IEventPublisher } from '../../../../shared/ports/event-publisher.port';

/**
 * Application Service
 * Orquesta la lógica de negocio
 * - Lee datos del repositorio (infraestructura)
 * - Modifica agregados (dominio)
 * - Publica eventos (infraestructura)
 * - Maneja transacciones
 */
@Injectable()
export class AdjustInventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY_TOKEN)
    private inventoryRepository: IInventoryRepository,
    @Inject('EventPublisher')
    private eventPublisher: IEventPublisher,
  ) {}

  async execute(
    inventoryItemId: string,
    newQuantity: number,
    reason: string,
  ): Promise<void> {
    // 1. Obtener el agregado
    const inventoryItem =
      await this.inventoryRepository.findById(inventoryItemId);

    if (!inventoryItem) {
      throw new NotFoundException('InventoryItem', inventoryItemId);
    }

    // 2. Modificar el agregado (lógica de negocio pura)
    inventoryItem.adjustQuantity(new Quantity(newQuantity), reason);

    // 3. Guardar cambios
    await this.inventoryRepository.save(inventoryItem);

    // 4. Publicar eventos
    await this.eventPublisher.publishMany(inventoryItem.getDomainEvents());

    // 5. Limpiar eventos (ya fueron publicados)
    inventoryItem.clearDomainEvents();
  }
}
