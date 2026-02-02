/**
 * Politica - Example Requests & Responses
 *
 * Reference examples for testing CONFIGURACIÓN API policy endpoints.
 * Use these to understand request/response structure and state transitions.
 */

/**
 * Example Request: Create Policy (CAMBIOS type).
 * Policies start in BORRADOR state and must be published separately.
 */
export const CREAR_POLITICA_CAMBIOS = {
  tipo: 'CAMBIOS',
  version: '1.0.0',
  contenido: `
    # Política de Cambios - v1.0.0
    
    ## Elegibilidad
    - Producto debe estar sin usar
    - Cambio debe solicitarse dentro de 30 días de compra
    - No aplica en liquidación
    
    ## Procedimiento
    1. Cliente solicita cambio con comprobante
    2. Empleado inspecciona producto
    3. Diferencia de precio se ajusta con nota de crédito/débito
    
    ## Excepciones
    - Ropa personalizada: No cambiable
  `,
  publicadoPorId: null,
};

/**
 * Example Request: Create Policy (ENVIOS type).
 */
export const CREAR_POLITICA_ENVIOS = {
  tipo: 'ENVIOS',
  version: '2.1.0',
  contenido: `
    # Política de Envíos - v2.1.0
    
    ## Cobertura
    - Envío nacional: Todo el país
    - Envío internacional: Países seleccionados
    
    ## Costos
    - Compras >$500: Envío gratis
    - Compras <$500: $150 + porcentaje
    
    ## Tiempos
    - Estándar: 5-7 días hábiles
    - Express: 2-3 días hábiles
  `,
  publicadoPorId: null,
};

/**
 * Example Request: Create Policy (TERMINOS type).
 */
export const CREAR_POLITICA_TERMINOS = {
  tipo: 'TERMINOS',
  version: '3.0.0',
  contenido: `
    # Términos y Condiciones - v3.0.0
    
    ## Uso del Servicio
    ...términos legales...
  `,
  publicadoPorId: null,
};

/**
 * Example Response: Policy Created (BORRADOR state).
 * Note: fechaVigenciaDesde and fechaVigenciaHasta are null until published.
 */
export const POLITICA_BORRADOR_RESPONSE = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  tipo: 'CAMBIOS',
  version: '1.0.0',
  contenido:
    '# Política de Cambios - v1.0.0\n\n## Elegibilidad\n- Producto debe estar sin usar\n...',
  estado: 'BORRADOR',
  fechaVigenciaDesde: null,
  fechaVigenciaHasta: null,
  publicadoPorId: null,
  fechaCreacion: '2026-02-02T22:00:00.000Z',
};

/**
 * Example Request: Publish Policy (BORRADOR → VIGENTE).
 * Once published, previous VIGENTE policy of same type is automatically archived.
 */
export const PUBLICAR_POLITICA_REQUEST = {
  fechaVigenciaDesde: '2026-02-15',
  publicadoPorId: '660e8400-e29b-41d4-a716-446655440001',
};

/**
 * Example Response: Policy Published (VIGENTE state).
 * Now enforced system-wide for this policy type.
 */
export const POLITICA_VIGENTE_RESPONSE = {
  id: '550e8400-e29b-41d4-a716-446655440010',
  tipo: 'CAMBIOS',
  version: '1.0.0',
  contenido:
    '# Política de Cambios - v1.0.0\n\n## Elegibilidad\n- Producto debe estar sin usar\n...',
  estado: 'VIGENTE',
  fechaVigenciaDesde: '2026-02-15',
  fechaVigenciaHasta: null,
  publicadoPorId: '660e8400-e29b-41d4-a716-446655440001',
  fechaCreacion: '2026-02-02T22:00:00.000Z',
};

/**
 * Example Response: List Policies (all states).
 * Shows lifecycle: BORRADOR → VIGENTE → ARCHIVADA
 */
export const LISTAR_POLITICAS_RESPONSE = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    tipo: 'CAMBIOS',
    version: '0.9.0',
    estado: 'ARCHIVADA',
    fechaVigenciaDesde: '2025-06-01',
    fechaVigenciaHasta: '2026-02-14',
    publicadoPorId: '660e8400-e29b-41d4-a716-446655440002',
    fechaCreacion: '2025-06-01T10:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    tipo: 'CAMBIOS',
    version: '1.0.0',
    estado: 'VIGENTE',
    fechaVigenciaDesde: '2026-02-15',
    fechaVigenciaHasta: null,
    publicadoPorId: '660e8400-e29b-41d4-a716-446655440001',
    fechaCreacion: '2026-02-02T22:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    tipo: 'CAMBIOS',
    version: '1.1.0',
    estado: 'BORRADOR',
    fechaVigenciaDesde: null,
    fechaVigenciaHasta: null,
    publicadoPorId: null,
    fechaCreacion: '2026-02-02T23:00:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    tipo: 'ENVIOS',
    version: '2.1.0',
    estado: 'VIGENTE',
    fechaVigenciaDesde: '2026-01-01',
    fechaVigenciaHasta: null,
    publicadoPorId: '660e8400-e29b-41d4-a716-446655440001',
    fechaCreacion: '2026-01-01T08:00:00.000Z',
  },
];
