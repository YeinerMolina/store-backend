// TODO: Swagger configuration - Implementar cuando @nestjs/swagger esté instalado
// Este archivo contendrá la configuración específica de Swagger para el módulo INVENTARIO

export const INVENTARIO_SWAGGER_CONFIG = {
  tag: 'Inventario',
  description: 'Gestión de inventario, reservas y movimientos de stock',
  endpoints: {
    RESERVAR: {
      path: 'POST /inventario/reservar',
      description: 'Reservar stock para venta o cambio',
    },
    CONSOLIDAR: {
      path: 'POST /inventario/consolidar',
      description: 'Consolidar una reserva (venta exitosa)',
    },
    AJUSTAR: {
      path: 'POST /inventario/ajustar',
      description: 'Ajuste manual de inventario',
    },
    DISPONIBILIDAD: {
      path: 'GET /inventario/disponibilidad',
      description: 'Consultar disponibilidad de producto',
    },
    OBTENER_POR_ITEM: {
      path: 'GET /inventario/item/:tipoItem/:itemId',
      description: 'Obtener datos de inventario por item',
    },
  },
};
