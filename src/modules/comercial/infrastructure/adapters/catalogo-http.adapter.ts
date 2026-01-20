import { Injectable } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import type {
  CatalogoPort,
  ProductoInfo,
} from '../../domain/ports/outbound/catalogo.port';

/**
 * ADAPTADOR OUTBOUND: CatalogoHttpAdapter
 * Implementa el puerto CatalogoPort usando comunicación HTTP
 * Se comunica con el módulo CATALOGO vía REST API
 *
 * Otras posibles implementaciones:
 * - CatalogoEventAdapter
 * - CatalogoInProcessAdapter
 */
@Injectable()
export class CatalogoHttpAdapter implements CatalogoPort {
  async obtenerPrecioVigente(itemId: UUID): Promise<Money> {
    // TODO: Implementar llamada real al módulo CATALOGO
    // const response = await this.http.get(`/catalogo/productos/${itemId}/precio`);
    // return Money.fromAmount(response.data.precio);

    console.log(`[CatalogoHttpAdapter] Obteniendo precio vigente: ${itemId}`);

    return Money.fromAmount(10000); // Simular precio
  }

  async obtenerProducto(itemId: UUID): Promise<ProductoInfo | null> {
    // TODO: Implementar llamada real al módulo CATALOGO
    // const response = await this.http.get(`/catalogo/productos/${itemId}`);
    // return mapToProductoInfo(response.data);

    console.log(`[CatalogoHttpAdapter] Obteniendo producto: ${itemId}`);

    return {
      id: itemId,
      nombre: 'Producto Ejemplo',
      precioVigente: Money.fromAmount(10000),
      estaActivo: true,
    };
  }

  async obtenerProductosMultiples(itemIds: UUID[]): Promise<ProductoInfo[]> {
    // TODO: Implementar llamada real al módulo CATALOGO
    // const response = await this.http.post('/catalogo/productos/batch', { ids: itemIds });
    // return response.data.map(mapToProductoInfo);

    console.log(`[CatalogoHttpAdapter] Obteniendo ${itemIds.length} productos`);

    return itemIds.map((id) => ({
      id,
      nombre: `Producto ${id.toString().substring(0, 8)}`,
      precioVigente: Money.fromAmount(10000),
      estaActivo: true,
    }));
  }
}
