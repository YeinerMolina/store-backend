import { Injectable } from '@nestjs/common';
import { UUID } from '../../../../shared/domain/value-objects/uuid.vo';
import {
  Venta,
  TipoVenta,
  ModalidadEntrega,
} from '../../domain/aggregates/venta.aggregate';
import {
  LineaVenta,
  TipoItem,
} from '../../domain/aggregates/linea-venta.entity';
import type { VentaService } from '../../domain/ports/inbound/venta.service';
import type { VentaRepository } from '../../domain/ports/outbound/venta-repository.port';
import type { InventarioPort } from '../../domain/ports/outbound/inventario.port';
import type { CatalogoPort } from '../../domain/ports/outbound/catalogo.port';
import type { EventBusPort } from '../../domain/ports/outbound/event-bus.port';

/**
 * APPLICATION SERVICE: VentaApplicationService
 * Implementa los casos de uso (puerto inbound VentaService)
 * Orquesta las operaciones entre el dominio y los puertos outbound
 *
 * IMPORTANTE:
 * - Esta clase NO contiene lógica de negocio (eso va en los agregados)
 * - Solo orquesta llamadas a puertos outbound y coordina el flujo
 * - Maneja transacciones y persistencia
 */
@Injectable()
export class VentaApplicationService implements VentaService {
  constructor(
    private readonly ventaRepository: VentaRepository,
    private readonly inventarioPort: InventarioPort,
    private readonly catalogoPort: CatalogoPort,
    private readonly eventBus: EventBusPort,
  ) {}

  /**
   * CU-COM-01: Crear Venta desde Carrito
   *
   * Flujo:
   * 1. Obtener carrito (puerto a PRE_VENTA - no implementado aún)
   * 2. Verificar disponibilidad de cada ítem (INVENTARIO)
   * 3. Obtener precios vigentes (CATALOGO)
   * 4. Reservar inventario (INVENTARIO)
   * 5. Crear agregado Venta
   * 6. Persistir
   * 7. Publicar eventos
   */
  async crearDesdeCarrito(carritoId: UUID, clienteId: UUID): Promise<Venta> {
    // TODO: Obtener carrito del módulo PRE_VENTA
    // const carrito = await this.preVentaPort.obtenerCarrito(carritoId);

    // Por ahora simulamos datos del carrito
    const itemsCarrito = [
      { itemId: UUID.create(), cantidad: 2, tipoItem: TipoItem.PRODUCTO },
    ];

    // 1. Verificar disponibilidad
    const disponibilidades =
      await this.inventarioPort.verificarDisponibilidadMultiple(
        itemsCarrito.map((i) => ({ itemId: i.itemId, cantidad: i.cantidad })),
      );

    const itemsNoDisponibles = disponibilidades.filter((d) => !d.disponible);
    if (itemsNoDisponibles.length > 0) {
      // TODO: Emitir evento ItemsExcluidosPorDisponibilidad
      throw new Error(
        `Items no disponibles: ${itemsNoDisponibles.map((i) => i.itemId).join(', ')}`,
      );
    }

    // 2. Obtener precios vigentes
    const productos = await this.catalogoPort.obtenerProductosMultiples(
      itemsCarrito.map((i) => i.itemId),
    );

    // 3. Crear líneas de venta con precios CONTRACTUALES
    const lineas: LineaVenta[] = [];
    for (const item of itemsCarrito) {
      const producto = productos.find((p) => p.id.equals(item.itemId));
      if (!producto) {
        throw new Error(`Producto no encontrado: ${item.itemId}`);
      }

      // Reservar inventario (20 minutos)
      await this.inventarioPort.reservar({
        itemId: item.itemId,
        cantidad: item.cantidad,
        motivoReserva: 'VENTA',
      });

      lineas.push(
        LineaVenta.crear({
          ventaId: UUID.create(), // Se actualizará con el ID real
          tipoItem: item.tipoItem,
          itemId: item.itemId,
          nombreItem: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: producto.precioVigente, // PRECIO CONTRACTUAL
        }),
      );
    }

    // 4. Crear agregado Venta (lógica de negocio en el agregado)
    const venta = Venta.crear({
      clienteId,
      empleadoId: null, // Venta digital
      carritoOrigenId: carritoId,
      tipo: TipoVenta.DIGITAL,
      modalidadEntrega: ModalidadEntrega.ENTREGA_EXTERNA,
      lineas,
    });

    // 5. Persistir
    await this.ventaRepository.save(venta);

    // 6. Publicar eventos
    const eventos = venta.getEventos();
    await this.eventBus.publishBatch(eventos);
    venta.limpiarEventos();

    return venta;
  }

  /**
   * CU-COM-02: Confirmar Venta (Pago Exitoso)
   */
  async confirmarVenta(ventaId: UUID): Promise<Venta> {
    const venta = await this.ventaRepository.findById(ventaId);
    if (!venta) {
      throw new Error(`Venta no encontrada: ${ventaId}`);
    }

    // Lógica de negocio en el agregado
    venta.confirmar();

    // Persistir cambios
    await this.ventaRepository.update(venta);

    // Publicar eventos
    const eventos = venta.getEventos();
    await this.eventBus.publishBatch(eventos);
    venta.limpiarEventos();

    return venta;
  }

  async obtenerPorId(ventaId: UUID): Promise<Venta | null> {
    return this.ventaRepository.findById(ventaId);
  }

  async listarPorCliente(clienteId: UUID): Promise<Venta[]> {
    return this.ventaRepository.findByClienteId(clienteId);
  }
}
