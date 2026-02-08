/**
 * ParametroOperativo - Example Requests & Responses
 *
 * Reference examples for testing CONFIGURACIÓN API endpoints.
 * Use these to understand request/response structure.
 */

/**
 * Example Request: Create Parameter (ENTERO type - seconds)
 */
export const CREAR_PARAMETRO_DURACION_RESERVA = {
  clave: 'DURACION_RESERVA_VENTA',
  nombre: 'Duración de Reserva para Ventas',
  descripcion:
    'Tiempo en segundos que se reservan ítems cuando cliente inicia pago online',
  tipoDato: 'ENTERO',
  valor: '1200',
  valorDefecto: '1200',
  valorMinimo: '300',
  valorMaximo: '3600',
  requiereReinicio: false,
};

/**
 * Example Request: Create Parameter (ENTERO type)
 */
export const CREAR_PARAMETRO_UMBRAL_STOCK = {
  clave: 'UMBRAL_STOCK_BAJO',
  nombre: 'Umbral de Stock Bajo',
  descripcion: 'Cantidad mínima de unidades antes de enviar notificación',
  tipoDato: 'ENTERO',
  valor: '10',
  valorDefecto: '10',
  valorMinimo: '1',
  valorMaximo: '1000',
  requiereReinicio: false,
};

/**
 * Example Request: Create Parameter (BOOLEAN type)
 */
export const CREAR_PARAMETRO_ACTIVO = {
  clave: 'SISTEMA_NOTIFICACIONES_ACTIVO',
  nombre: 'Sistema de Notificaciones Activo',
  descripcion: 'Habilita o deshabilita el envío de notificaciones in-app',
  tipoDato: 'BOOLEAN',
  valor: 'true',
  valorDefecto: 'true',
};

/**
 * Example Request: Create Parameter (DECIMAL type)
 */
export const CREAR_PARAMETRO_PORCENTAJE_DESCUENTO = {
  clave: 'PORCENTAJE_DESCUENTO_LIQUIDACION',
  nombre: 'Porcentaje de Descuento Liquidación',
  descripcion: 'Descuento aplicado a productos en liquidación',
  tipoDato: 'DECIMAL',
  valor: '0.25',
  valorDefecto: '0.25',
  valorMinimo: '0.01',
  valorMaximo: '0.99',
  requiereReinicio: false,
};

/**
 * Example Response: ParametroOperativo Created
 */
export const PARAMETRO_RESPONSE = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  clave: 'DURACION_RESERVA_VENTA',
  nombre: 'Duración de Reserva para Ventas',
  descripcion:
    'Tiempo en segundos que se reservan ítems cuando cliente inicia pago online',
  tipoDato: 'ENTERO',
  valor: '1200',
  valorDefecto: '1200',
  valorMinimo: '300',
  valorMaximo: '3600',
  requiereReinicio: false,
  modificadoPorId: null,
  fechaModificacion: '2026-02-02T21:30:00.000Z',
  fechaCreacion: '2026-02-02T21:30:00.000Z',
};

/**
 * Example Request: Update Parameter Value
 */
export const ACTUALIZAR_PARAMETRO_REQUEST = {
  valor: '1500',
  modificadoPorId: '660e8400-e29b-41d4-a716-446655440001',
};

/**
 * Example Response: List Parameters
 */
export const LISTAR_PARAMETROS_RESPONSE = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    clave: 'DURACION_RESERVA_VENTA',
    nombre: 'Duración de Reserva para Ventas',
    tipoDato: 'ENTERO',
    valor: '1200',
    valorDefecto: '1200',
    valorMinimo: '300',
    valorMaximo: '3600',
    requiereReinicio: false,
    modificadoPorId: null,
    fechaModificacion: '2026-02-02T21:30:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    clave: 'UMBRAL_STOCK_BAJO',
    nombre: 'Umbral de Stock Bajo',
    tipoDato: 'ENTERO',
    valor: '10',
    valorDefecto: '10',
    valorMinimo: '1',
    valorMaximo: '1000',
    requiereReinicio: false,
    modificadoPorId: null,
    fechaModificacion: '2026-02-02T21:30:00.000Z',
  },
];
