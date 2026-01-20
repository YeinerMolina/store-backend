import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Venta } from '../../aggregates/venta.aggregate';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para persistencia de Ventas
 * La infraestructura (Prisma) implementa esta interfaz
 */
export interface IVentaRepository {
  save(venta: Venta): Promise<void>;
  findById(id: UUID): Promise<Venta | null>;
  findByClienteId(clienteId: UUID): Promise<Venta[]>;
  update(venta: Venta): Promise<void>;
}
