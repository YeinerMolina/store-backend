import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Venta } from '../../aggregates/venta.aggregate';

/**
 * PUERTO OUTBOUND (Driven Port)
 * Define el contrato para persistencia de Ventas
 * La infraestructura implementa esta interfaz
 *
 * Implementaciones:
 * - VentaRepositoryPostgres (Prisma + PostgreSQL)
 * - VentaRepositoryMongo (Mongoose + MongoDB)
 * - VentaRepositoryInMemory (Testing)
 */
export interface VentaRepository {
  save(venta: Venta): Promise<void>;
  findById(id: UUID): Promise<Venta | null>;
  findByClienteId(clienteId: UUID): Promise<Venta[]>;
  update(venta: Venta): Promise<void>;
}
