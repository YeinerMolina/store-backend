import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Tabla de Base de Datos
 * IMPORTANTE: Esto NO es el agregado de dominio.
 * Es solo la representación persistida. Se mapea al agregado en el repositorio.
 */
@Entity('inventory_items')
@Index(['sku'], { unique: true })
@Index(['productId'])
export class InventoryItemSchema {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar', { length: 50 })
  sku: string;

  @Column('uuid')
  productId: string;

  @Column('integer')
  quantity: number;

  @Column('integer', { default: 0 })
  reservedQuantity: number;

  @Column('integer', { default: 10 })
  minimumThreshold: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
