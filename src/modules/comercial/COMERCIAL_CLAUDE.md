# Módulo COMERCIAL

**Contexto**: COMERCIAL  
**Responsabilidad**: Gestión de ventas, cambios y clientes  
**Archivo de Entidades**: `COMERCIAL_ENTITIES_CLAUDE.md`

---

## Visión del Módulo

COMERCIAL es el corazón transaccional del sistema. Aquí ocurren las VENTAS (donde se fija el precio y se compromete el inventario) y los CAMBIOS (devoluciones con ítems nuevos).

---

## Responsabilidades

1. **Gestión de Clientes**: Registro de clientes (CON_CUENTA y SIN_CUENTA)
2. **Direcciones de Clientes**: Gestión de direcciones de entrega
3. **Ventas**: Proceso completo desde borrador hasta entrega
4. **Cambios**: Proceso controlado con diferencia de precio

---

## Agregado: Cliente

**Root**: Cliente  
**Entidades**: DireccionCliente, PreferenciaNotificacion (ver PRE_VENTA)

**Invariantes v2.1**:

- tipo_cliente: CON_CUENTA o SIN_CUENTA
- Email obligatorio si CON_CUENTA
- Solo CON_CUENTA puede tener carrito digital, listas de deseos, preferencias

---

## Agregado: Venta

**Root**: Venta  
**Entidades**: LineaVenta, Cambio

**Invariantes**:

1. Una venta debe tener AL MENOS una línea
2. Los precios en LineaVenta son CONTRACTUALES (fijados al crear venta)
3. Total de venta = subtotal - descuento + costo_envio
4. Cambios solo sobre líneas con `puede_ser_cambiada = true`

### CU-COM-01: Crear Venta desde Carrito

**Actor**: Sistema (desde PRE_VENTA)

**Flujo Crítico**:

1. Obtener carrito ACTIVO
2. Para cada ItemCarrito:
   - Verificar disponibilidad en INVENTARIO
   - Si no disponible → marcar para exclusión
3. Si hay exclusiones:
   - Evento: `ItemsExcluidosPorDisponibilidad`
   - COMUNICACION notifica cliente
   - ¿Cliente continúa? → SÍ/NO
4. Para ítems disponibles:
   - Obtener precio VIGENTE del catálogo
   - Reservar inventario (INVENTARIO.ReservarInventario)
5. Crear Venta (estado BORRADOR) + LineaVenta
6. Actualizar carrito: estado = CONVERTIDO, venta_id
7. Evento: `VentaCreada`

---

### CU-COM-02: Confirmar Venta (Pago Exitoso)

**Actor**: Sistema (desde pasarela de pago)

**Flujo**:

1. Venta en estado BORRADOR recibe confirmación de pago
2. Cambiar estado a CONFIRMADA
3. FISCAL genera DocumentoFiscal
4. Si modalidad_entrega = ENTREGA_EXTERNA → LOGISTICA crea Envio
5. Evento: `VentaConfirmada`

---

### CU-COM-03: Solicitar Cambio

**Actor**: Cliente

**Precondiciones**:

- Venta debe estar ENTREGADA
- Línea debe tener `puede_ser_cambiada = true`
- Producto nuevo debe ser elegible para cambio

**Flujo**:

1. Cliente selecciona línea de venta original
2. Cliente selecciona producto/paquete nuevo
3. Sistema verifica disponibilidad en INVENTARIO
4. Si disponible → reservar (20 min)
5. Crear Cambio (estado SOLICITADO)
6. Calcular diferencia de precio
7. Evento: `CambioSolicitado`

---

### CU-COM-04: Ejecutar Cambio

**Actor**: Empleado (con permiso)

**Flujo**:

1. Cliente devuelve ítem original → estado RECIBIDO
2. Empleado valida estado del producto → APROBADO / RECHAZADO
3. Si APROBADO:
   - Sistema consolida reserva del ítem nuevo
   - Sistema descuenta inventario ítem nuevo
   - Sistema suma inventario ítem original
   - Si hay diferencia de precio:
     - > 0 → Cliente paga → FISCAL genera NotaDebito
     - < 0 → Tienda reembolsa → FISCAL genera NotaCredito
   - Crear LineaVenta nueva con `es_resultado_cambio = true`
   - Estado cambio = EJECUTADO
4. Evento: `CambioEjecutado`

---

## Reglas de Negocio

### RN-COM-01: Cliente CON_CUENTA

- Email es obligatorio
- Puede tener carrito digital, listas, preferencias

### RN-COM-02: Precio Contractual

El precio en LineaVenta se fija al crear la venta y NO cambia.

### RN-COM-03: Cambios con Diferencia

Si precio_item_nuevo != precio_item_original:

- Diferencia positiva → Cliente paga (NotaDebito)
- Diferencia negativa → Tienda reembolsa (NotaCredito)

### RN-COM-04: Direccion Snapshot

Al crear venta, se guarda `direccion_entrega_snapshot` (JSON) para preservar la dirección aunque el cliente la modifique después.

---

## Eventos de Dominio

| Evento              | Cuándo                  | Payload                                        |
| ------------------- | ----------------------- | ---------------------------------------------- |
| `ClienteRegistrado` | Al crear cliente        | cliente_id, tipo                               |
| `VentaCreada`       | Al crear desde carrito  | venta_id, cliente_id, carrito_origen_id        |
| `VentaConfirmada`   | Pago exitoso            | venta_id, total                                |
| `VentaEntregada`    | Entrega completada      | venta_id, fecha_entrega                        |
| `CambioSolicitado`  | Cliente solicita cambio | cambio_id, venta_id, item_original, item_nuevo |
| `CambioEjecutado`   | Cambio completado       | cambio_id, diferencia_precio                   |
| `CambioRechazado`   | Empleado rechaza        | cambio_id, motivo                              |

---

## Integraciones

### PROVEE a:

- FISCAL: Venta y Cambio (para documentos)
- LOGISTICA: Venta (para envíos)

### CONSUME de:

- CATALOGO: Precios vigentes
- INVENTARIO: Reservas y disponibilidad
- PRE_VENTA: Carrito
- IDENTIDAD: Empleado (para cambios)

---

**Referencia**: Ver `COMERCIAL_ENTITIES_CLAUDE.md`
