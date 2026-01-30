export const RESERVAR_INVENTARIO_REQUEST_EXAMPLE = {
  tipoItem: 'PRODUCTO',
  itemId: '01933e7f-1234-7890-abcd-ef1234567890',
  cantidad: 5,
  operacionId: '01933e7f-5678-1234-abcd-ef1234567890',
  tipoOperacion: 'VENTA',
  actorTipo: 'EMPLEADO',
  actorId: '01933e7f-9012-3456-abcd-ef1234567890',
} as const;

export const RESERVA_RESPONSE_EXAMPLE = {
  id: '01933e7f-abcd-ef12-3456-7890abcdef12',
  inventarioId: '01933e7f-1111-2222-3333-444444444444',
  cantidad: 5,
  estado: 'ACTIVA',
  fechaCreacion: '2026-01-30T05:30:00.000Z',
  fechaExpiracion: '2026-01-30T05:50:00.000Z',
  tipoOperacion: 'VENTA',
  operacionId: '01933e7f-5678-1234-abcd-ef1234567890',
} as const;

export const INVENTARIO_RESPONSE_EXAMPLE = {
  id: '01933e7f-1111-2222-3333-444444444444',
  tipoItem: 'PRODUCTO',
  itemId: '01933e7f-1234-7890-abcd-ef1234567890',
  cantidadDisponible: 45,
  cantidadReservada: 5,
  cantidadAbandono: 0,
  ubicacion: 'Almacén A - Estante 3',
  version: 12,
  fechaActualizacion: '2026-01-30T05:30:00.000Z',
} as const;

export const DISPONIBILIDAD_RESPONSE_EXAMPLE = {
  disponible: true,
  cantidadDisponible: 45,
  cantidadSolicitada: 5,
  mensaje: 'Hay suficiente stock disponible',
} as const;

export const AJUSTAR_INVENTARIO_REQUEST_EXAMPLE = {
  inventarioId: '01933e7f-1111-2222-3333-444444444444',
  cantidad: -3,
  empleadoId: '01933e7f-9012-3456-abcd-ef1234567890',
  intencion: 'Producto dañado en transporte',
  notas: 'Caja mojada, 3 unidades no vendibles',
} as const;

export const CONSOLIDAR_RESERVA_REQUEST_EXAMPLE = {
  reservaId: '01933e7f-abcd-ef12-3456-7890abcdef12',
  operacionId: '01933e7f-5678-1234-abcd-ef1234567890',
} as const;

export const CREAR_INVENTARIO_REQUEST_EXAMPLE = {
  tipoItem: 'PRODUCTO',
  itemId: '01933e7f-1234-7890-abcd-ef1234567890',
  cantidadInicial: 100,
  empleadoId: '01933e7f-9012-3456-abcd-ef1234567890',
  ubicacion: 'Almacén A - Estante 3',
  notas: 'Stock inicial de producto nuevo',
} as const;
