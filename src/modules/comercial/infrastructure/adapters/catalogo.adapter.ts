import { Injectable } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import type {
  ICatalogoPort,
  ProductoInfo,
} from '../../domain/ports/outbound/i-catalogo.port';

/**
 * ADAPTADOR OUTBOUND: CatalogoAdapter
 * Implementa el puerto ICatalogoPort
 * Se comunica con el módulo CATALOGO
 */
@Injectable()
export class CatalogoAdapter implements ICatalogoPort {
  async obtenerPrecioVigente(itemId: UUID): Promise<Money> {
    // TODO: Implementar llamada real al módulo CATALOGO
    console.log(`[CatalogoAdapter] Obteniendo precio vigente: ${itemId}`);

    return Money.fromAmount(10000); // Simular precio
  }

  async obtenerProducto(itemId: UUID): Promise<ProductoInfo | null> {
    // TODO: Implementar llamada real al módulo CATALOGO
    console.log(`[CatalogoAdapter] Obteniendo producto: ${itemId}`);

    return {
      id: itemId,
      nombre: 'Producto Ejemplo',
      precioVigente: Money.fromAmount(10000),
      estaActivo: true,
    };
  }

  async obtenerProductosMultiples(itemIds: UUID[]): Promise<ProductoInfo[]> {
    // TODO: Implementar llamada real al módulo CATALOGO
    console.log(`[CatalogoAdapter] Obteniendo ${itemIds.length} productos`);

    return itemIds.map((id) => ({
      id,
      nombre: `Producto ${id.toString().substring(0, 8)}`,
      precioVigente: Money.fromAmount(10000),
      estaActivo: true,
    }));
  }
}
