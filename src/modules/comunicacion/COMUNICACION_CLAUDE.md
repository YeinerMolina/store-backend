# Módulo COMUNICACIÓN

**Contexto**: COMUNICACION  
**Responsabilidad**: Sistema de notificaciones in-app  
**Archivo de Entidades**: `COMUNICACION_ENTITIES_CLAUDE.md`

**NUEVO en v2.1**

---

## Visión

Sistema transversal de notificaciones unidireccionales (solo envío, no hay respuesta del usuario). Inicialmente solo canal IN_APP.

---

## Responsabilidades

1. Crear notificaciones desde eventos de dominio
2. Enviar notificaciones respetando preferencias del cliente
3. Reintentar envíos fallidos (máx 3 intentos)
4. Mantener historial de notificaciones

---

## Agregado: Notificacion

**Root**: Notificacion  
**Entidades**: Ninguna (atómica)

**Invariantes**:

1. Toda notificación tiene evento_origen (trazabilidad)
2. Máximo 3 intentos de envío
3. Notificaciones TRANSACCIONALES ignoran preferencias (siempre se envían)
4. Canal inicial: IN_APP únicamente

---

## Casos de Uso

### CU-COM-01: Crear Notificación desde Evento

**Actor**: Sistema (listeners de eventos de dominio)

**Flujo**:

1. Sistema escucha evento de dominio (ej: `VentaConfirmada`)
2. Sistema determina:
   - tipo_notificacion (ej: "VENTA_CONFIRMADA")
   - categoria (TRANSACCIONAL, LISTA_DESEOS, OPERATIVA)
   - destinatario (cliente o empleado)
3. Si categoría != TRANSACCIONAL:
   - Verificar PreferenciaNotificacion del cliente
   - Si deshabilitada → NO crear notificación
4. Sistema crea Notificacion:
   - estado = PENDIENTE
   - intentos_envio = 0
   - evento_origen_tipo/id (trazabilidad)
5. Evento: `NotificacionCreada`

---

### CU-COM-02: Enviar Notificación

**Actor**: Sistema (proceso asíncrono)

**Flujo**:

1. Sistema toma notificaciones PENDIENTES
2. Para cada notificación:
   - Intentar envío (guardar en bandeja in-app del destinatario)
   - Si exitoso:
     - estado = ENVIADA
     - fecha_envio = now()
   - Si falla:
     - incrementar intentos_envio
     - Si intentos < 3:
       - fecha_proximo_reintento = now() + INTERVALO_REINTENTO
     - Si intentos = 3:
       - estado = FALLIDA
3. Evento: `NotificacionEnviada` o `NotificacionFallida`

---

### CU-COM-03: Reintentar Notificaciones Fallidas

**Actor**: Sistema (job cada minuto)

**Flujo**:

1. Sistema busca notificaciones con:
   - estado = PENDIENTE
   - fecha_proximo_reintento <= now()
2. Reintenta envío (ver CU-COM-02)

---

### CU-COM-04: Marcar Notificación como Descartada

**Actor**: Cliente o Empleado

**Flujo**:

1. Usuario descarta notificación desde UI
2. Sistema actualiza fecha_descarte = now()
3. (Estado sigue siendo ENVIADA, solo se marca como descartada)

---

## Reglas de Negocio

### RN-COM-01: Categorías de Notificación

- **TRANSACCIONAL**: Obligatorias (ignorar preferencias)
  - Ejemplos: confirmación de venta, cambio ejecutado
- **LISTA_DESEOS**: Opcionales
  - Ejemplos: producto disponible, promoción
- **OPERATIVA**: Para empleados
  - Ejemplos: stock bajo, aprobación pendiente

### RN-COM-02: Reintentos

Máximo 3 intentos con intervalo de 5 minutos (configurable).

### RN-COM-03: Trazabilidad Obligatoria

Toda notificación debe tener `evento_origen_tipo` y opcionalmente `evento_origen_id`.

### RN-COM-04: Canal Único Inicial

Solo canal IN_APP en v2.1. Email/SMS/Push en futuro.

---

## Eventos

| Evento                | Cuándo                | Payload                             |
| --------------------- | --------------------- | ----------------------------------- |
| `NotificacionCreada`  | Al crear notificación | notificacion_id, tipo, destinatario |
| `NotificacionEnviada` | Envío exitoso         | notificacion_id, fecha              |
| `NotificacionFallida` | Fallo definitivo      | notificacion_id, intentos           |

---

## Tipos de Notificación (Ejemplos)

| Tipo                             | Categoría     | Evento Origen                             |
| -------------------------------- | ------------- | ----------------------------------------- |
| `VENTA_CONFIRMADA`               | TRANSACCIONAL | VentaConfirmada                           |
| `ITEMS_EXCLUIDOS_CARRITO`        | TRANSACCIONAL | ItemsExcluidosPorDisponibilidad           |
| `CAMBIO_EJECUTADO`               | TRANSACCIONAL | CambioEjecutado                           |
| `PRODUCTO_DISPONIBLE_NUEVAMENTE` | LISTA_DESEOS  | ProductoDeListaDeseosDisponibleNuevamente |
| `PRODUCTO_EN_PROMOCION`          | LISTA_DESEOS  | ProductoDeListaDeseosEnPromocion          |
| `STOCK_BAJO`                     | OPERATIVA     | StockBajoDetectado                        |

---

## Integraciones

### CONSUME de:

- AUDITORIA: EventoDominio (origen de notificaciones)
- PRE_VENTA: PreferenciaNotificacion (filtrado)

---

## Consideraciones

### Índices Críticos

- `(destinatario_tipo, destinatario_id, estado)`
- `(estado, fecha_proximo_reintento)` para job de reintentos

### Jobs Background

- Job cada minuto: reintentar notificaciones fallidas

---

**Referencia**: Ver `COMUNICACION_ENTITIES_CLAUDE.md`
