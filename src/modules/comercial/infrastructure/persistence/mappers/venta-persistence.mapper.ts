import { UUID } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../../shared/domain/value-objects/money.vo';
import {
  Venta,
  EstadoVenta,
  TipoVenta,
  ModalidadEntrega,
} from '../../../domain/aggregates/venta.aggregate';
import { LineaVenta } from '../../../domain/aggregates/linea-venta.entity';

/**
 * MAPPER: VentaPersistenceMapper
 * Traduce entre modelo de dominio (Venta) y modelo de Prisma
 *
 * IMPORTANTE:
 * - Dominio y persistencia evolucionan independientemente
 * - Este mapper es el único que conoce ambos modelos
 */
export class VentaPersistenceMapper {
  /**
   * Convierte Venta (dominio) → Prisma Data
   */
  static toPrisma(venta: Venta): any {
    return {
      id: venta.getId().toString(),
      cliente_id: venta.getClienteId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      // ... mapear todos los campos
      // Este es un ejemplo simplificado
    };
  }

  /**
   * Convierte Prisma Data → Venta (dominio)
   */
  static toDomain(prismaData: any): Venta {
    // TODO: Implementar reconstrucción completa del agregado
    // Por ahora retornamos null para evitar errores de compilación
    throw new Error('VentaPersistenceMapper.toDomain: Not implemented yet');
  }
}
