-- CONFIGURACIÓN Module Migration
-- Crea tablas para gestionar parámetros operativos y políticas del sistema

-- ==================== ENUMS ====================

/**
 * Tipo de dato para validación de parámetros
 * - ENTERO: número entero sin decimales
 * - DECIMAL: número con decimales
 * - BOOLEAN: true/false
 * - TEXTO: cadena de texto
 * - DURACION: formato de duración (ej: "20 minutes")
 */
CREATE TYPE tipo_dato AS ENUM ('ENTERO', 'DECIMAL', 'BOOLEAN', 'TEXTO', 'DURACION');

/**
 * Tipo de política legal/operativa
 * - CAMBIOS: Política de cambios de producto
 * - ENVIOS: Política de envíos
 * - TERMINOS: Términos y condiciones
 */
CREATE TYPE tipo_politica AS ENUM ('CAMBIOS', 'ENVIOS', 'TERMINOS');

/**
 * Ciclo de vida de una política
 * - BORRADOR: En revisión, no aplicable
 * - VIGENTE: Actualmente aplicable
 * - ARCHIVADA: Obsoleta, reemplazada
 */
CREATE TYPE estado_politica AS ENUM ('BORRADOR', 'VIGENTE', 'ARCHIVADA');

-- ==================== TABLES ====================

/**
 * parametro_operativo: Parámetro configurable del sistema
 *
 * Almacena valores configurables que controlan el comportamiento operativo
 * sin necesidad de recompilación. Cada parámetro se valida según su tipo_dato.
 *
 * Ejemplo:
 *   clave: DURACION_RESERVA_VENTA
 *   tipo_dato: DURACION
 *   valor: "20 minutes"
 *   valor_minimo: "1 minutes"
 *   valor_maximo: "60 minutes"
 */
CREATE TABLE parametro_operativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave varchar(255) NOT NULL UNIQUE,
  nombre varchar(100) NOT NULL,
  descripcion text,
  tipo_dato tipo_dato NOT NULL,
  valor varchar(500) NOT NULL,
  valor_defecto varchar(500) NOT NULL,
  valor_minimo varchar(100),
  valor_maximo varchar(100),
  requiere_reinicio boolean NOT NULL DEFAULT false,
  modificado_por uuid,
  fecha_modificacion timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT ck_parametro_clave CHECK (clave ~ '^[A-Z_]+$')
);

-- Índices en parametro_operativo
CREATE INDEX idx_parametro_operativo_clave ON parametro_operativo (clave);
CREATE INDEX idx_parametro_operativo_modificado_por ON parametro_operativo (modificado_por);

/**
 * politica: Política versionada del negocio
 *
 * Gestiona políticas legales/operativas con versionado y ciclo de vida.
 * Invariante: Solo una política VIGENTE por tipo en cada momento.
 *
 * Ejemplo:
 *   tipo: CAMBIOS
 *   version: 2.1.0
 *   estado: VIGENTE
 *   fecha_vigencia_desde: 2026-02-01
 */
CREATE TABLE politica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_politica NOT NULL,
  version varchar(10) NOT NULL,
  contenido text NOT NULL,
  estado estado_politica NOT NULL DEFAULT 'BORRADOR',
  fecha_vigencia_desde date,
  fecha_vigencia_hasta date,
  publicado_por uuid,
  fecha_creacion timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT ck_politica_version CHECK (version ~ '^\d+\.\d+\.\d+$'),
  CONSTRAINT ck_politica_contenido_not_empty CHECK (contenido <> ''),
  CONSTRAINT ck_politica_vigencia CHECK (
    fecha_vigencia_desde IS NULL OR 
    fecha_vigencia_hasta IS NULL OR 
    fecha_vigencia_desde <= fecha_vigencia_hasta
  ),
  UNIQUE (tipo, version)
);

-- Índices en politica
CREATE INDEX idx_politica_tipo ON politica (tipo);
CREATE INDEX idx_politica_estado ON politica (estado);
CREATE INDEX idx_politica_tipo_estado ON politica (tipo, estado);

-- Vista para "una política vigente por tipo"
-- Útil para validaciones y queries frecuentes
CREATE VIEW vw_politica_vigente AS
SELECT DISTINCT ON (tipo)
  id,
  tipo,
  version,
  contenido,
  estado,
  fecha_vigencia_desde,
  fecha_vigencia_hasta,
  publicado_por,
  fecha_creacion
FROM politica
WHERE estado = 'VIGENTE'
ORDER BY tipo, fecha_vigencia_desde DESC NULLS LAST;

-- ==================== COMMENTS ====================

COMMENT ON TABLE parametro_operativo IS 'Parámetros operativos configurables del sistema sin recompilación';
COMMENT ON COLUMN parametro_operativo.clave IS 'Identificador único del parámetro (ej: DURACION_RESERVA_VENTA)';
COMMENT ON COLUMN parametro_operativo.tipo_dato IS 'Tipo para validación: ENTERO, DECIMAL, BOOLEAN, TEXTO, DURACION';
COMMENT ON COLUMN parametro_operativo.requiere_reinicio IS 'Si true, cambios en este parámetro requieren reinicio de la app';

COMMENT ON TABLE politica IS 'Políticas legales/operativas versionadas del negocio (cambios, envíos, términos)';
COMMENT ON COLUMN politica.tipo IS 'Categoría de política: CAMBIOS, ENVIOS, TERMINOS';
COMMENT ON COLUMN politica.estado IS 'Ciclo de vida: BORRADOR (en revisión), VIGENTE (activa), ARCHIVADA (obsoleta)';
COMMENT ON COLUMN politica.fecha_vigencia_desde IS 'Cuándo comienza a aplicar la política';
COMMENT ON COLUMN politica.fecha_vigencia_hasta IS 'Cuándo deja de aplicar (null si aún vigente)';
