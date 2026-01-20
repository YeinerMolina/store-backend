# Módulo PRE-VENTA

**Contexto**: PRE_VENTA  
**Responsabilidad**: Gestión de fase pre-transaccional (Carrito, Listas de Deseos, Preferencias)  
**Archivo de Entidades**: `PRE_VENTA_ENTITIES_CLAUDE.md`

**NUEVO en v2.1**

---

## Visión del Módulo

Este módulo gestiona todo lo que ocurre ANTES de la venta: el carrito de compras, las listas de deseos y las preferencias de notificación de los clientes.

**Principio clave**: Este es el espacio de intención, NO de compromiso. El carrito NO reserva inventario.

---

## Responsabilidades

1. **Gestión de Carrito**: Estado pre-transaccional, digital y físico
2. **Listas de Deseos**: Colecciones personalizadas de productos de interés
3. **Preferencias de Notificación**: Configuración de comunicaciones del cliente

---

## Agregado: Carrito

**Root**: Carrito  
**Entidades**: ItemCarrito

**Invariantes**:

1. Un cliente CON_CUENTA puede tener UN ÚNICO Carrito ACTIVO
2. Carrito DIGITAL solo para clientes CON_CUENTA
3. Carrito FISICO requiere empleado_id
4. **El Carrito NO reserva inventario** (decisión congelada)
5. Los precios en ItemCarrito son referenciales (pueden cambiar)

### CU-EXP-01: Agregar Producto a Carrito

**Actor**: Cliente (con cuenta) o Empleado (carrito físico)

**Flujo**:

1. Actor selecciona producto/paquete y cantidad
2. Sistema verifica: ¿cliente tiene carrito ACTIVO?
   - Si no → crear carrito
   - Si sí → usar existente
3. Sistema verifica: ¿el ítem ya está en el carrito?
   - Si sí → sumar cantidad
   - Si no → crear ItemCarrito
4. Sistema guarda precio_referencial (snapshot del precio vigente)
5. Evento: `ProductoAgregadoACarrito`

**Nota**: No se verifica disponibilidad en inventario en este punto.

---

### CU-EXP-02: Visualizar Carrito

**Actor**: Cliente

**Flujo**:

1. Sistema obtiene carrito ACTIVO
2. Para cada ItemCarrito:
   - Obtener precio ACTUAL del catálogo
   - **Verificar disponibilidad en INVENTARIO** (en tiempo real)
   - Marcar ítems no disponibles
3. Mostrar carrito con advertencias de disponibilidad

**Nota**: Verificación de disponibilidad es reactiva, no bloquea stock.

---

### CU-EXP-03: Convertir Carrito a Venta (Ver COMERCIAL)

Este es el momento crítico donde:

- Se verifica disponibilidad real
- Se reservan ítems (interacción con INVENTARIO)
- Se fijan precios contractuales
- Se crea la Venta

**Ver**: `COMERCIAL_CLAUDE.md` para el flujo completo.

---

## Agregado: ListaDeseos

**Root**: ListaDeseos  
**Entidades**: ItemListaDeseos

**Invariantes**:

1. Solo clientes CON_CUENTA pueden tener listas
2. Un cliente puede tener MÚLTIPLES listas
3. Exactamente UNA lista debe ser `es_por_defecto = true`
4. Un ítem no puede duplicarse en la misma lista
5. No se guarda precio (siempre se muestra el vigente)

### CU-EXP-04: Crear Lista de Deseos

**Actor**: Cliente (con cuenta)

**Flujo**:

1. Cliente proporciona nombre de lista
2. Sistema valida que cliente tenga cuenta
3. Sistema crea lista con estado ACTIVA
4. Si es la primera lista del cliente → marcar como por defecto
5. Evento: `ListaDeseosCreada`

---

### CU-EXP-05: Agregar Producto a Lista

**Actor**: Cliente

**Flujo**:

1. Cliente selecciona producto/paquete y lista destino
2. Sistema valida unicidad (item no debe estar en esa lista)
3. Sistema crea ItemListaDeseos
4. Evento: `ProductoAgregadoAListaDeseos`

---

### CU-EXP-06: Notificar Disponibilidad (Trigger)

**Actor**: Sistema (desde evento de INVENTARIO)

**Flujo**:

1. INVENTARIO emite `InventarioActualizado` (producto pasa de 0 a >0)
2. Sistema busca clientes con ese producto en listas de deseos
3. Para cada cliente:
   - Verificar PreferenciaNotificacion (categoría LISTA_DESEOS)
   - Si habilitada → COMUNICACION crea notificación

---

## Agregado: PreferenciaNotificacion

**Root**: PreferenciaNotificacion (dentro del agregado Cliente)

**Invariantes**:

1. Solo para clientes CON_CUENTA
2. Notificaciones TRANSACCIONALES no pueden deshabilitarse
3. Una preferencia por tipo de notificación por cliente

### CU-EXP-07: Configurar Preferencias

**Actor**: Cliente (con cuenta)

**Flujo**:

1. Cliente selecciona tipo de notificación y habilita/deshabilita
2. Sistema valida:
   - Que no sea categoría TRANSACCIONAL (no modificable)
   - Que el cliente tenga cuenta
3. Sistema actualiza/crea preferencia
4. Evento: `PreferenciaNotificacionActualizada`

---

## Reglas de Negocio

### RN-EXP-01: Un Carrito Activo por Cliente

Cliente CON_CUENTA puede tener máximo UN carrito ACTIVO (digital).

**Implementación**: Constraint único parcial: `(cliente_id, estado='ACTIVO')`

---

### RN-EXP-02: Precio Referencial vs Contractual

`ItemCarrito.precio_referencial` es informativo. El precio REAL se fija al iniciar pago.

---

### RN-EXP-03: Carrito Físico Temporal

Carritos FISICOS se abandonan automáticamente después de X horas sin actividad.

**Parámetro**: `HORAS_EXPIRACION_CARRITO_FISICO` (default: 4)

---

### RN-EXP-04: Lista por Defecto

Cada cliente CON_CUENTA debe tener exactamente UNA lista marcada como por defecto.

---

### RN-EXP-05: Preferencias Transaccionales

Las notificaciones de categoría TRANSACCIONAL no pueden deshabilitarse (obligatorias).

---

## Eventos de Dominio

| Evento                                      | Cuándo                   | Payload                       |
| ------------------------------------------- | ------------------------ | ----------------------------- |
| `CarritoCreado`                             | Al crear carrito         | carrito_id, cliente_id, tipo  |
| `ProductoAgregadoACarrito`                  | Al agregar ítem          | carrito_id, item_id, cantidad |
| `CarritoConvertidoAVenta`                   | Al iniciar pago          | carrito_id, venta_id          |
| `ItemsExcluidosPorDisponibilidad`           | Items sin stock al pagar | carrito_id, items excluidos   |
| `ListaDeseosCreada`                         | Al crear lista           | lista_id, cliente_id, nombre  |
| `ProductoAgregadoAListaDeseos`              | Al agregar a lista       | lista_id, item_id             |
| `ProductoDeListaDeseosDisponibleNuevamente` | Stock > 0                | item_id, clientes afectados   |
| `PreferenciaNotificacionActualizada`        | Al cambiar preferencia   | cliente_id, tipo, habilitada  |

---

## Integraciones

### PROVEE a:

#### COMERCIAL

- Carrito: Para conversión a Venta

#### COMUNICACION

- PreferenciaNotificacion: Para filtrar notificaciones opcionales
- ListaDeseos: Para triggers de notificación

### CONSUME de:

#### CATALOGO

- Producto/Paquete: Para carrito y listas

#### INVENTARIO

- Disponibilidad: Para mostrar en carrito (no reservar)

---

## Consideraciones

### Índices Críticos

- `carrito (cliente_id, estado)` único parcial
- `item_lista_deseos (lista_deseos_id, tipo_item, item_id)` único
- `preferencia_notificacion (cliente_id, tipo_notificacion)` único

### Jobs Background

- Abandonar carritos físicos expirados (cada hora)

---

**Referencia**: Ver `PRE_VENTA_ENTITIES_CLAUDE.md` para detalles de persistencia.
