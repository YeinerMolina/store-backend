# Módulo AUDITORÍA

**Contexto**: AUDITORIA  
**Responsabilidad**: Registro de eventos de dominio  
**Archivo de Entidades**: `AUDITORIA_ENTITIES_CLAUDE.md`

---

## Visión

Registro inmutable de TODOS los eventos de dominio del sistema. Proporciona trazabilidad completa de operaciones.

---

## Responsabilidades

1. **Registro de Eventos**: Capturar todos los eventos de dominio
2. **Consulta de Auditoría**: Buscar eventos por entidad, tipo, fecha
3. **Trazabilidad**: Reconstruir historial completo de una entidad

---

## Agregado: EventoDominio

**Root**: EventoDominio  
**Invariantes**:

- **INSERT-only** (inmutable, nunca se modifica ni elimina)
- Todo evento tiene tipo, agregado y actor
- Payload en JSON (libre, schema por tipo de evento)

---

## Casos de Uso

### CU-AUD-01: Registrar Evento de Dominio

**Actor**: Sistema (cualquier módulo)

**Flujo**:

1. Módulo emite evento de dominio (ej: `VentaConfirmada`)
2. Sistema crea EventoDominio:
   - tipo_evento: "VentaConfirmada"
   - agregado_tipo: "Venta"
   - agregado_id: ID de la venta
   - actor_tipo: EMPLEADO / CLIENTE / SISTEMA
   - actor_id: ID del actor
   - payload: JSON con datos del evento
   - correlacion_id: para agrupar eventos relacionados
3. Sistema persiste evento
4. Listeners de eventos pueden procesarlo (ej: COMUNICACION crea notificaciones)

---

### CU-AUD-02: Consultar Historial de Entidad

**Actor**: Empleado (con permiso CONSULTAR_AUDITORIA)

**Flujo**:

1. Empleado busca eventos de una entidad específica
2. Sistema filtra por agregado_tipo y agregado_id
3. Sistema devuelve eventos ordenados por fecha
4. Empleado reconstruye historial completo

---

### CU-AUD-03: Buscar Eventos por Correlación

**Actor**: Empleado (soporte técnico)

**Flujo**:

1. Empleado busca todos los eventos de una operación compleja
2. Sistema filtra por correlacion_id
3. Sistema devuelve todos los eventos relacionados (cross-módulo)

**Ejemplo**: Conversión de Carrito a Venta genera múltiples eventos con mismo correlacion_id:

- `CarritoConvertidoAVenta`
- `InventarioReservado` (múltiples)
- `VentaCreada`
- `VentaConfirmada`
- `FacturaGenerada`

---

## Reglas de Negocio

### RN-AUD-01: Inmutabilidad

EventoDominio es INSERT-only. Nunca se actualiza ni elimina.

### RN-AUD-02: Correlación

Eventos de una misma operación compleja comparten correlacion_id.

### RN-AUD-03: Actor Obligatorio

Todo evento debe tener actor_tipo (EMPLEADO, CLIENTE, SISTEMA).

---

## Tipos de Eventos del Sistema

**Ver cada módulo** para lista completa de eventos. Ejemplos:

| Evento                    | Módulo              | Agregado        |
| ------------------------- | ------------------- | --------------- |
| `TerceroRegistrado`       | IDENTIDAD           | Tercero         |
| `ProductoCreado`          | CATALOGO            | Producto        |
| `InventarioReservado`     | INVENTARIO          | Inventario      |
| `CarritoConvertidoAVenta` | PRE_VENTA | Carrito         |
| `VentaConfirmada`         | COMERCIAL           | Venta           |
| `CambioEjecutado`         | COMERCIAL           | Cambio          |
| `EnvioEntregado`          | LOGISTICA           | Envio           |
| `FacturaGenerada`         | FISCAL              | DocumentoFiscal |
| `NotificacionEnviada`     | COMUNICACION        | Notificacion    |

---

## Eventos de Dominio (v2.1)

**NUEVOS eventos en v2.1**:

- `CarritoCreado`
- `ProductoAgregadoACarrito`
- `CarritoConvertidoAVenta`
- `ItemsExcluidosPorDisponibilidad`
- `ListaDeseosCreada`
- `ProductoAgregadoAListaDeseos`
- `ProductoDeListaDeseosDisponibleNuevamente`
- `NotificacionCreada`
- `NotificacionEnviada`
- `NotificacionFallida`

---

## Integraciones

### PROVEE a:

- COMUNICACION: Eventos para generar notificaciones
- TODOS: Consulta de auditoría

### CONSUME de:

- TODOS: Todos los módulos emiten eventos

---

## Consideraciones

### Índices Críticos

- `(agregado_tipo, agregado_id)` para historial de entidad
- `tipo_evento` para búsqueda por tipo
- `fecha_evento` para búsquedas temporales
- `correlacion_id` para operaciones complejas

### Retención de Datos

Considerar política de archivado de eventos antiguos (ej: >2 años).

### Performance

Tabla de solo inserción optimizada para append-only writes.

---

**Referencia**: Ver `AUDITORIA_ENTITIES_CLAUDE.md`
