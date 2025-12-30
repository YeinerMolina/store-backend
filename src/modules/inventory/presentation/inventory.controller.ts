import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AdjustInventoryService } from '../application/services/adjust-inventory.service';
import type { IInventoryRepository } from '../domain/inventory.repository';
import { INVENTORY_REPOSITORY_TOKEN } from '../domain/inventory.repository';
import {
  InventoryItemDTO,
  UpdateInventoryItemDTO,
} from './dtos/inventory-item.dto';
import { InventoryItemMapper } from '../application/mappers/inventory-item.mapper';

/**
 * Controller
 * Solo maneja HTTP. Delegación de lógica al Application Service.
 */
@Controller('inventory')
export class InventoryController {
  private mapper = new InventoryItemMapper();

  constructor(
    private adjustInventoryService: AdjustInventoryService,
    @Inject(INVENTORY_REPOSITORY_TOKEN)
    private inventoryRepository: IInventoryRepository,
  ) {}

  @Get(':id')
  async getById(@Param('id') id: string): Promise<InventoryItemDTO | null> {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      return null;
    }
    return this.mapper.toDTO(item);
  }

  @Get()
  async getAll(): Promise<InventoryItemDTO[]> {
    const items = await this.inventoryRepository.findAll();
    return items.map((item) => this.mapper.toDTO(item));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDTO,
  ): Promise<void> {
    await this.adjustInventoryService.execute(id, dto.quantity, dto.reason);
  }
}
