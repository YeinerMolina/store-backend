# Módulo INVENTARIO

**Contexto**: INVENTARIO  
**Responsabilidad**: Control de existencias, reservas y movimientos de stock  
**Archivo de Entidades**: `INVENTARIO_ENTITIES_CLAUDE.md`

---

## Visión del Módulo

INVENTARIO es el guardián de la disponibilidad. Controla CUÁNTO hay de cada producto/paquete y garantiza que no se venda lo que no existe.

**Decisión Crítica v2.1**: El Carrito NO reserva inventario. Las reservas se hacen SOLO al iniciar el pago (conversión Carrito → Venta).

---

## Responsabilidades

1. **Control de Existencias**: Mantener cantidad disponible por producto/paquete
2. **Reservas Temporales**: Bloquear stock durante proceso de venta (20 minutos)
3. **Movimientos de Inventario**: Registrar todas las entradas/salidas (inmutable)
4. **Detección de Stock Bajo**: Notificar cuando stock < umbral
5. **Liberación Automática**: Expirar reservas no consolidadas

---

## Agregado: Inventario

**Root**: Inventario  
**Entidades**: Reserva, MovimientoInventario

**Invariantes**:

1. `cantidad_disponible + cantidad_reservada + cantidad_abandono` = stock real
2. `cantidad_disponible >= 0` siempre
3. Una reserva ACTIVA bloquea inventario hasta consolidación o expiración
4. Todo cambio de cantidad DEBE generar MovimientoInventario (auditoría)
5. Control de concurrencia optimista con campo `version`

---

## Casos de Uso

### CU-INV-01: Reservar Inventario (desde Venta)

**Actor**: Sistema (desde COMERCIAL)

**Precondiciones**:

- Inventario debe existir
- cantidad_disponible >= cantidad solicitada

**Flujo**:

1. Sistema solicita reserva para venta_id
2. Sistema verifica disponibilidad con lock optimista
3. Sistema descuenta cantidad_disponible
4. Sistema suma cantidad_reservada
5. Sistema crea Reserva con estado ACTIVA, fecha_expiracion = now() + 20 min
6. Sistema crea MovimientoInventario tipo RESERVA
7. Evento: `InventarioReservado`

**Flujos Alternativos**:

- Si no hay suficiente disponibilidad → rechazar
- Si hay conflicto de concurrencia → reintentar

---

### CU-INV-02: Consolidar Reserva (venta exitosa)

**Actor**: Sistema (desde COMERCIAL)

**Flujo**:

1. Sistema busca reserva ACTIVA por venta_id
2. Sistema cambia estado reserva a CONSOLIDADA
3. Sistema descuenta cantidad_reservada
4. Sistema crea MovimientoInventario tipo VENTA_SALIDA
5. Evento: `InventarioDescontado`

**Nota**: La cantidad ya estaba reservada, solo se consolida la salida.

---

### CU-INV-03: Liberar Reserva (expirada o cancelada)

**Actor**: Sistema (job automático o cancelación manual)

**Flujo**:

1. Sistema busca reservas ACTIVAS con fecha_expiracion < now()
2. Para cada reserva:
   - Cambia estado a EXPIRADA
   - Suma cantidad_disponible
   - Descuenta cantidad_reservada
   - Crea MovimientoInventario tipo LIBERACION
3. Evento: `ReservaExpirada`

---

### CU-INV-04: Ajuste Manual de Inventario

**Actor**: Empleado (con permiso AJUSTAR_INVENTARIO)

**Flujo**:

1. Empleado selecciona inventario, cantidad a ajustar e intencion
2. Sistema verifica permisos
3. Sistema ajusta cantidad_disponible
4. Sistema crea MovimientoInventario tipo AJUSTE_OPERATIVO con empleado_id
5. Evento: `InventarioAjustado`

---

### CU-INV-05: Detectar Stock Bajo

**Actor**: Sistema (trigger automático)

**Flujo**:

1. Sistema detecta que cantidad_disponible < UMBRAL_STOCK_BAJO
2. Evento: `StockBajoDetectado`
3. COMUNICACION crea notificaciones para empleados responsables

---

## Reglas de Negocio

### RN-INV-01: Carrito NO Reserva

Decisión congelada v2.1: El carrito NO interactúa con inventario.

### RN-INV-02: Duración de Reserva

Reservas de venta: 20 minutos desde creación.  
Reservas de cambio: 20 minutos desde aprobación.

### RN-INV-03: Movimientos Inmutables

MovimientoInventario es INSERT-only. Nunca se actualiza ni elimina.

### RN-INV-04: Control de Concurrencia

Usar optimistic locking con campo `version` para evitar sobreventa.

---

## Eventos de Dominio

| Evento                 | Cuándo                       | Payload                              |
| ---------------------- | ---------------------------- | ------------------------------------ |
| `InventarioCreado`     | Al crear registro inventario | inventario_id, item_id, tipo         |
| `InventarioReservado`  | Al reservar stock            | reserva_id, cantidad, venta_id       |
| `InventarioDescontado` | Al consolidar venta          | inventario_id, cantidad              |
| `ReservaExpirada`      | Al liberar reserva vencida   | reserva_id, cantidad liberada        |
| `StockBajoDetectado`   | Stock < umbral               | inventario_id, cantidad actual       |
| `InventarioAjustado`   | Ajuste manual                | inventario_id, cantidad, empleado_id |

---

## Integraciones

### PROVEE a:

- COMERCIAL: Disponibilidad de productos/paquetes
- PRE_VENTA: Verificación de disponibilidad para carrito

### CONSUME de:

- COMERCIAL: Eventos de Venta y Cambio (para reservar/consolidar)
- CATALOGO: Producto/Paquete (para crear inventario)
- IDENTIDAD: Empleado (para ajustes manuales)

---

## Consideraciones de Implementación

### Índices Críticos

- `(tipo_item, item_id)` único
- `inventario.ubicacion`
- `reserva.estado + fecha_expiracion` (para job de expiración)

### Jobs Background

- Job cada minuto: liberar reservas expiradas
- Job diario: detectar stock bajo

### Optimistic Locking

```sql
UPDATE inventario
SET cantidad_disponible = cantidad_disponible - ?, version = version + 1
WHERE id = ? AND version = ?
```

---

**Referencia**: Ver `INVENTARIO_ENTITIES_CLAUDE.md` para detalles de persistencia.
