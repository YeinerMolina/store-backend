# Diseño de Persistencia y Backend v2
## Tienda Retail - Dominio v2.1

**Versión del Diseño**: 2.0  
**Fecha**: Enero 2026  
**Basado en**: Dominio de Negocio v2.1  
**Autor**: Arquitecto de Software Senior

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Entidades Persistentes](#2-entidades-persistentes)
3. [Agregados y Límites](#3-agregados-y-límites)
4. [Relaciones](#4-relaciones)
5. [Datos Derivados y Redundantes](#5-datos-derivados-y-redundantes)
6. [Operaciones del Backend](#6-operaciones-del-backend)
7. [Riesgos Técnicos](#7-riesgos-técnicos)
8. [Ajustes Sugeridos al Dominio](#8-ajustes-sugeridos-al-dominio)
9. [Decisiones Arquitectónicas](#9-decisiones-arquitectónicas)
10. [Matriz de Trazabilidad](#10-matriz-de-trazabilidad)

---

## 1. Resumen Ejecutivo

### 1.1 Alcance

Este documento traduce el dominio de negocio v2.1 de una tienda retail de productos de vestir a un diseño lógico de persistencia y backend. El dominio ahora incluye:

**Funcionalidades existentes (v1):**
- Ventas físicas y digitales
- Inventario con reservas
- Cambios controlados
- Envíos externos
- Documentación fiscal
- Gestión de terceros con roles múltiples

**Nuevas funcionalidades (v2.1):**
- **Carrito**: Estado pre-transaccional sin reserva de inventario
- **Lista de Deseos**: Múltiples listas por cliente con triggers de notificación
- **Notificaciones**: Sistema transversal in-app con preferencias configurables

### 1.2 Principios Rectores del Diseño

1. **Fidelidad al dominio**: Ninguna simplificación técnica que comprometa reglas de negocio.
2. **Separación modelo dominio / modelo persistencia**: Permite evolución independiente.
3. **Consistencia sobre rendimiento**: Priorizar integridad de datos en operaciones críticas.
4. **Auditabilidad nativa**: Todo cambio de estado debe ser rastreable.
5. **Tecnología agnóstica**: Decisiones que permitan múltiples implementaciones.
6. **Desacoplamiento de notificaciones**: El sistema de notificaciones es transversal y no conoce la lógica de negocio.

### 1.3 Contextos Identificados (Actualizado v2.1)

| Contexto | Responsabilidad Principal | Entidades Clave |
|----------|---------------------------|-----------------|
| **Identidad** | Gestión de terceros y sus roles | Tercero, Empleado, Proveedor |
| **Catálogo** | Definición de productos vendibles | Producto, Paquete, Categoría |
| **Inventario** | Control de existencias y reservas | Inventario, Reserva, MovimientoInventario |
| **Experiencia Cliente** | Pre-venta y preferencias | **Carrito, ListaDeseos, PreferenciaNotificacion** |
| **Comercial** | Ventas y cambios | Venta, LineaVenta, Cambio, Cliente |
| **Logística** | Envíos y entregas | Envio, IncidenciaEntrega |
| **Fiscal** | Documentación legal | DocumentoFiscal, NotaCredito, NotaDebito |
| **Comunicación** | Notificaciones | **Notificacion** |
| **Configuración** | Parámetros operativos | ParametroOperativo, Politica |
| **Seguridad** | Perfiles y permisos | Perfil, Permiso, AsignacionPerfil |

### 1.4 Resumen de Entidades

**Total: 32 entidades** (6 nuevas respecto a v1)

| Contexto | Entidades v1 | Nuevas v2.1 | Total |
|----------|--------------|-------------|-------|
| Identidad | 4 | 0 | 4 |
| Catálogo | 4 | 0 | 4 |
| Inventario | 3 | 0 | 3 |
| Experiencia Cliente | 1 (DireccionCliente) | 5 | 6 |
| Comercial | 4 | 0 | 4 |
| Logística | 1 | 0 | 1 |
| Fiscal | 2 | 0 | 2 |
| Comunicación | 0 | 1 | 1 |
| Configuración | 2 | 0 | 2 |
| Seguridad | 4 | 0 | 4 |
| Auditoría | 1 | 0 | 1 |

---

## 2. Entidades Persistentes

### 2.1 Nuevas Entidades v2.1

#### 2.1.1 Carrito

**Origen en el dominio**: Sección 3.18 - Estado pre-transaccional que representa intención de compra.

**Razón para persistirla**: 
- Los clientes con cuenta esperan que su carrito persista entre sesiones
- Permite análisis de comportamiento de compra
- Habilita recuperación de carritos abandonados (futuro)

**Datos clave a almacenar**:
- Identificador único
- Referencia a Cliente (obligatoria)
- Referencia a Empleado (si es venta física asistida)
- Tipo de carrito (DIGITAL / FISICO)
- Estado (ACTIVO / CONVERTIDO / ABANDONADO)
- Fecha de creación
- Fecha de última modificación
- Fecha de conversión a venta (si aplica)
- Referencia a Venta resultante (si se convirtió)

**Datos que NO deben persistirse**:
- Disponibilidad de inventario (se verifica dinámicamente)
- Precio definitivo (se fija al convertir a Venta)
- Reservas de inventario (el Carrito NO reserva)

**Reglas de negocio críticas**:
1. Un Cliente con cuenta puede tener UN ÚNICO Carrito ACTIVO
2. Carrito DIGITAL solo para clientes CON_CUENTA
3. Carrito FISICO requiere empleado_id
4. **El Carrito NO reserva inventario** - Decisión congelada del dominio

---

#### 2.1.2 ItemCarrito

**Origen en el dominio**: Implícito en Carrito - ítems seleccionados.

**Razón para persistirla**: Detalle de productos deseados por el cliente.

**Datos clave a almacenar**:
- Identificador único
- Referencia a Carrito
- Tipo de ítem (PRODUCTO / PAQUETE)
- Referencia al ítem (Producto o Paquete)
- Cantidad deseada
- Precio referencial (snapshot informativo)
- Fecha de agregado
- Fecha de última modificación

**Datos que NO deben persistirse**:
- Disponibilidad actual (derivada de Inventario)
- Precio contractual (se fija al iniciar pago)

**Trade-off**: `precio_referencial` es un snapshot informativo para mostrar al cliente, pero el precio real se determina al momento de convertir a Venta. Esto evita inconsistencias si el catálogo cambia.

---

#### 2.1.3 ListaDeseos

**Origen en el dominio**: Sección 3.19 - Colección de ítems de interés para compra futura.

**Razón para persistirla**: 
- Permite múltiples listas personalizadas por cliente
- Fuente de triggers para notificaciones de disponibilidad y promociones
- Facilita conversión futura a ventas

**Datos clave a almacenar**:
- Identificador único
- Referencia a Cliente (obligatoria)
- Nombre de la lista
- Indicador de lista por defecto (boolean)
- Estado (ACTIVA / ARCHIVADA)
- Fecha de creación
- Fecha de última modificación

**Reglas de negocio críticas**:
1. Solo clientes CON_CUENTA pueden tener listas
2. Un cliente puede tener MÚLTIPLES listas
3. Exactamente UNA lista debe ser `es_por_defecto = true`
4. La lista por defecto se crea automáticamente con la cuenta

---

#### 2.1.4 ItemListaDeseos

**Origen en el dominio**: Implícito en ListaDeseos - ítems de interés.

**Razón para persistirla**: Detalle de productos en cada lista.

**Datos clave a almacenar**:
- Identificador único
- Referencia a ListaDeseos
- Tipo de ítem (PRODUCTO / PAQUETE)
- Referencia al ítem
- Notas personales del cliente (opcional)
- Fecha de agregado

**Datos que NO deben persistirse**:
- Precio (siempre se muestra el vigente del catálogo)
- Disponibilidad (se consulta en tiempo real)

**Restricción**: Un ítem puede aparecer UNA SOLA VEZ por lista (unicidad compuesta).

---

#### 2.1.5 PreferenciaNotificacion

**Origen en el dominio**: Sección 3.6 - Preferencias de notificación del cliente.

**Razón para persistirla**: 
- Permite al cliente configurar qué notificaciones recibir
- Respeta las categorías obligatorias vs opcionales del dominio

**Datos clave a almacenar**:
- Identificador único
- Referencia a Cliente
- Tipo de notificación específico
- Categoría (TRANSACCIONAL / LISTA_DESEOS / OPERATIVA)
- Habilitada (boolean)
- Fecha de modificación

**Reglas de negocio críticas**:
1. Las notificaciones TRANSACCIONALES no pueden deshabilitarse
2. Solo aplica para clientes CON_CUENTA
3. Se inicializan con valores por defecto al crear cuenta

---

#### 2.1.6 Notificacion

**Origen en el dominio**: Sección 3.20 - Comunicación unidireccional.

**Razón para persistirla**: 
- Registro de todas las notificaciones enviadas
- Soporte para reintentos de envío fallido
- Trazabilidad de comunicaciones

**Datos clave a almacenar**:
- Identificador único
- Tipo de destinatario (CLIENTE / EMPLEADO)
- Referencia al destinatario
- Tipo de notificación
- Categoría
- Título y contenido
- Estado (PENDIENTE / ENVIADA / FALLIDA)
- Canal (IN_APP inicialmente)
- Tipo y ID del evento origen (trazabilidad)
- Tipo y ID de entidad relacionada (opcional)
- Contador de intentos de envío
- Fechas: creación, envío, próximo reintento, descarte

**Reglas de negocio críticas**:
1. Toda notificación debe vincularse a un evento de dominio
2. Máximo 3 reintentos con intervalo de 5 minutos
3. Canal inicial único: IN_APP
4. No existe estado "leída" (unidireccional)

---

### 2.2 Entidades Modificadas v2.1

#### 2.2.1 Cliente (Modificada)

**Cambios respecto a v1**:
- Nuevo atributo: `tipo_cliente` (CON_CUENTA / SIN_CUENTA)
- Validación condicional: email obligatorio solo si CON_CUENTA

**Impacto**:
- Habilita diferenciación de funcionalidades por tipo
- Solo CON_CUENTA puede tener Carrito persistente, ListaDeseos y preferencias de notificación

---

#### 2.2.2 Venta (Modificada)

**Cambios respecto a v1**:
- Nueva referencia opcional: `carrito_origen_id`

**Impacto**:
- Permite trazabilidad de conversión Carrito → Venta
- Útil para análisis de abandono de carritos

---

#### 2.2.3 ParametroOperativo (Modificada)

**Nuevos parámetros**:
- `UMBRAL_STOCK_BAJO` (default: 10) - Para triggers de notificación
- `INTERVALO_REINTENTO_NOTIFICACION` (default: 5 minutos)
- `MAX_REINTENTOS_NOTIFICACION` (default: 3)

---

#### 2.2.4 Permiso (Modificada)

**Nueva categoría**: NOTIFICACIONES

**Nuevo permiso**: `VER_NOTIFICACIONES_OPERATIVAS`

---

### 2.3 Entidades Sin Cambios

Las siguientes entidades mantienen su diseño de v1:
- Tercero, Empleado, ProveedorBienes, ProveedorServicios
- Categoria, Producto, Paquete, PaqueteComponente
- Inventario, Reserva, MovimientoInventario
- LineaVenta, Cambio
- Envio
- DocumentoFiscal, NotaAjuste
- Politica
- Perfil, PerfilPermiso, EmpleadoPerfil
- EventoDominio

---

## 3. Agregados y Límites

### 3.1 Nuevos Agregados v2.1

#### 3.1.1 Agregado: Carrito

**Aggregate Root**: Carrito

**Entidades internas**:
- ItemCarrito (ciclo de vida controlado por Carrito)

**Entidades relacionadas (fuera del agregado)**:
- Cliente (referencia)
- Empleado (referencia opcional)
- Producto/Paquete (referencia desde ItemCarrito)
- Venta (referencia si se convirtió)

**Reglas de consistencia**:
1. Un Cliente CON_CUENTA puede tener máximo UN Carrito ACTIVO
2. Un Carrito DIGITAL requiere Cliente CON_CUENTA
3. Un Carrito FISICO requiere empleado_id
4. El Carrito NO interactúa con Inventario
5. Los precios en ItemCarrito son referenciales

**Operaciones atómicas**:
- Crear carrito (validar unicidad si digital)
- Agregar ítem (verificar duplicados, guardar precio referencial)
- Modificar cantidad
- Remover ítem
- Convertir a Venta (proceso complejo - ver operaciones cross-agregado)
- Abandonar carrito (solo FISICO)

**Invariantes**:
- Un carrito ACTIVO por cliente CON_CUENTA
- ItemCarrito.cantidad > 0
- Carrito DIGITAL siempre de cliente CON_CUENTA

---

#### 3.1.2 Agregado: ListaDeseos

**Aggregate Root**: ListaDeseos

**Entidades internas**:
- ItemListaDeseos (ciclo de vida controlado por ListaDeseos)

**Entidades relacionadas**:
- Cliente (referencia)
- Producto/Paquete (referencia desde ItemListaDeseos)

**Reglas de consistencia**:
1. Solo clientes CON_CUENTA pueden tener listas
2. Exactamente una lista debe ser `es_por_defecto = true` por cliente
3. Un ítem no puede duplicarse dentro de la misma lista
4. Un ítem puede estar en múltiples listas del mismo cliente

**Operaciones atómicas**:
- Crear lista (si es primera, marcar como defecto)
- Agregar ítem (validar unicidad en lista)
- Remover ítem
- Archivar lista (no eliminar, preservar historial)
- Cambiar lista por defecto (desmarcar anterior, marcar nueva)

**Invariantes**:
- Exactamente una lista por defecto por cliente
- No duplicados de ítem en misma lista

---

#### 3.1.3 Agregado: Notificación

**Aggregate Root**: Notificacion

**Entidades internas**: Ninguna (es atómica)

**Entidades relacionadas**:
- Cliente o Empleado (destinatario)
- EventoDominio (origen de la notificación)
- Cualquier entidad relacionada (venta, cambio, producto, etc.)

**Reglas de consistencia**:
1. Toda notificación debe tener evento origen
2. intentos_envio <= MAX_REINTENTOS_NOTIFICACION
3. Estado FALLIDA solo si intentos = máximo
4. Las transaccionales no verifican preferencias (siempre se envían)

**Operaciones atómicas**:
- Crear notificación (desde evento de dominio)
- Marcar como enviada
- Registrar intento fallido (incrementar contador, programar reintento)
- Marcar como fallida definitiva
- Descartar (por el usuario)

**Invariantes**:
- Siempre tiene evento_origen_tipo
- Estado coherente con intentos_envio

---

### 3.2 Agregados Existentes - Impacto v2.1

#### 3.2.1 Agregado: Inventario (Sin cambios estructurales)

**Cambio conceptual importante**: 
El dominio v2.1 explicita que **el Carrito NO reserva inventario**. Esto ya estaba implícito en v1 pero ahora es regla congelada.

La reserva SOLO ocurre cuando:
- Se inicia proceso de pago (Carrito → Venta)
- Se aprueba un cambio con ítem nuevo

**Nuevo evento**: `StockBajoDetectado` - Se dispara cuando cantidad_disponible cae bajo UMBRAL_STOCK_BAJO.

---

#### 3.2.2 Agregado: Venta (Modificación menor)

**Cambio**: Nueva referencia opcional a `carrito_origen_id`.

**Impacto en operaciones**:
- Al crear Venta desde Carrito, registrar el origen
- El Carrito se marca como CONVERTIDO

---

#### 3.2.3 Agregado: Cliente (Ampliado)

**Nuevas entidades internas**:
- PreferenciaNotificacion

**Nuevas operaciones**:
- Actualizar preferencias de notificación
- Crear lista de deseos por defecto al registrar cuenta

---

## 4. Relaciones

### 4.1 Nuevas Relaciones v2.1

#### 4.1.1 Cliente → Carrito

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Asociación condicional |
| **Cardinalidad** | Cliente 1 : 0..1 Carrito (ACTIVO) |
| **Dependencia** | Débil - carrito puede existir sin cliente CON_CUENTA solo si es FISICO |
| **Eliminación** | Cascada lógica (abandonar carrito si se desactiva cliente) |
| **Restricción** | Cliente CON_CUENTA: máximo 1 carrito ACTIVO |

---

#### 4.1.2 Carrito → ItemCarrito

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Composición |
| **Cardinalidad** | Carrito 1 : 0..* ItemCarrito |
| **Dependencia** | Fuerte - ítem no existe sin carrito |
| **Eliminación** | Cascada |
| **Actualización** | Ítems modificables mientras carrito ACTIVO |

---

#### 4.1.3 Cliente → ListaDeseos

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Composición condicional |
| **Cardinalidad** | Cliente 1 : 0..* ListaDeseos |
| **Dependencia** | Fuerte - lista no existe sin cliente CON_CUENTA |
| **Eliminación** | Cascada lógica (archivar, no eliminar) |
| **Restricción** | Solo clientes CON_CUENTA |

---

#### 4.1.4 ListaDeseos → ItemListaDeseos

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Composición |
| **Cardinalidad** | ListaDeseos 1 : 0..* ItemListaDeseos |
| **Dependencia** | Fuerte |
| **Eliminación** | Cascada |
| **Restricción** | Unicidad: (lista_id, tipo_item, item_id) |

---

#### 4.1.5 Cliente → PreferenciaNotificacion

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Composición |
| **Cardinalidad** | Cliente 1 : 0..* PreferenciaNotificacion |
| **Dependencia** | Fuerte |
| **Eliminación** | Cascada |
| **Restricción** | Solo clientes CON_CUENTA, una por tipo de notificación |

---

#### 4.1.6 Carrito → Venta

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Asociación unidireccional opcional |
| **Cardinalidad** | Carrito 0..1 : 0..1 Venta |
| **Dependencia** | Débil - Venta puede existir sin Carrito origen |
| **Actualización** | Se establece al convertir, inmutable después |

---

#### 4.1.7 Notificacion → Destinatario (Cliente/Empleado)

| Aspecto | Valor |
|---------|-------|
| **Tipo** | Asociación polimórfica |
| **Cardinalidad** | Notificacion * : 1 (Cliente o Empleado) |
| **Dependencia** | Débil |
| **Implementación** | destinatario_tipo + destinatario_id |

---

## 5. Datos Derivados y Redundantes

### 5.1 Nuevos Datos Derivados v2.1

#### 5.1.1 Disponibilidad de Ítem en Carrito

**Qué se deriva**: Si un ítem del carrito está disponible para compra.

**Cómo se calcula**: 
- Producto: Inventario.cantidad_disponible > 0 AND Producto.estado = ACTIVO
- Paquete: MIN(disponibilidad de cada componente) > 0 AND Paquete.estado = ACTIVO

**Cuándo se calcula**: 
- Al visualizar el carrito
- Al iniciar proceso de pago

**Persistir o no**: **NO PERSISTIR**. Cambia frecuentemente con operaciones de inventario.

---

#### 5.1.2 Precio Actual de Ítem en Carrito

**Qué se deriva**: Precio vigente del catálogo.

**Cuándo se calcula**: En tiempo de visualización.

**Persistir o no**: 
- `precio_referencial` en ItemCarrito: **SÍ PERSISTIR** como snapshot informativo
- Precio real: **NO PERSISTIR** - se fija al convertir a Venta

---

#### 5.1.3 Disponibilidad de Ítem en Lista de Deseos

**Qué se deriva**: Si el ítem está disponible y puede moverse al carrito.

**Cómo se calcula**: Igual que para carrito.

**Persistir o no**: **NO PERSISTIR**.

---

#### 5.1.4 Notificaciones Pendientes por Destinatario

**Qué se deriva**: Conteo de notificaciones no descartadas.

**Cuándo se calcula**: Al mostrar indicador en UI.

**Persistir o no**: **NO PERSISTIR**. Consulta simple con índice.

---

#### 5.1.5 Ítems Agotados en Lista de Deseos (para Notificaciones)

**Qué se deriva**: Productos en listas de deseos que se agotaron.

**Cuándo se calcula**: Al procesar evento StockBajoDetectado o InventarioDescontado.

**Persistir o no**: **NO PERSISTIR**. Se consulta al generar notificaciones.

---

### 5.2 Redundancias Necesarias v2.1

| Dato | Dónde se persiste | Por qué es redundante pero necesario |
|------|-------------------|--------------------------------------|
| precio_referencial en ItemCarrito | ItemCarrito | Snapshot informativo, producto puede cambiar precio |
| carrito_origen_id en Venta | Venta | Trazabilidad de conversión |
| evento_origen_tipo/id en Notificacion | Notificacion | Trazabilidad obligatoria del dominio |

---

## 6. Operaciones del Backend

### 6.1 Agregado Carrito

#### Operaciones de Escritura

| Operación | Descripción | Sensibilidad Concurrencia | Atómica |
|-----------|-------------|---------------------------|---------|
| CrearCarrito | Nuevo carrito para cliente | Media - validar unicidad | Sí |
| AgregarItemCarrito | Añade producto/paquete | Baja | Sí |
| ModificarCantidad | Cambia cantidad de ítem | Baja | Sí |
| RemoverItemCarrito | Elimina ítem del carrito | Baja | Sí |
| AbandonarCarrito | Solo para carrito físico | Baja | Sí |

#### Operaciones de Lectura

| Operación | Descripción | Criticidad |
|-----------|-------------|------------|
| ObtenerCarritoActivo | Carrito activo del cliente | Alta |
| ListarItemsCarrito | Con disponibilidad calculada | Alta |
| CalcularTotalReferencial | Suma de precios vigentes | Media |

---

### 6.2 Agregado ListaDeseos

#### Operaciones de Escritura

| Operación | Descripción | Sensibilidad Concurrencia | Atómica |
|-----------|-------------|---------------------------|---------|
| CrearListaDeseos | Nueva lista nombrada | Baja | Sí |
| AgregarItemLista | Con validación unicidad | Baja | Sí |
| RemoverItemLista | Elimina ítem | Baja | Sí |
| ArchivarLista | Cambia estado a archivada | Baja | Sí |
| CambiarListaDefecto | Actualiza flags | Media | Sí |
| MoverItemACarrito | Lista → Carrito | Media | Sí |

#### Operaciones de Lectura

| Operación | Descripción | Criticidad |
|-----------|-------------|------------|
| ListarListasCliente | Todas las listas activas | Media |
| ObtenerItemsLista | Con disponibilidad y precio actual | Media |
| BuscarClientesConItemEnLista | Para notificaciones masivas | Media |

---

### 6.3 Agregado Notificacion

#### Operaciones de Escritura

| Operación | Descripción | Sensibilidad Concurrencia | Atómica |
|-----------|-------------|---------------------------|---------|
| CrearNotificacion | Desde evento de dominio | Baja | Sí |
| MarcarEnviada | Actualiza estado y fecha | Baja | Sí |
| RegistrarIntentoFallido | Incrementa contador | Baja | Sí |
| MarcarFallidaDefinitiva | Después de max reintentos | Baja | Sí |
| DescartarNotificacion | Por acción del usuario | Baja | Sí |
| ProcesarReintentos | Job batch periódico | Media | Por notificación |

#### Operaciones de Lectura

| Operación | Descripción | Criticidad |
|-----------|-------------|------------|
| ListarNotificacionesDestinatario | Filtrado por estado | Alta |
| ObtenerPendientesReintento | Para job de reintentos | Media |
| ContarNoDescartadas | Para badge en UI | Alta |

---

### 6.4 Operaciones Cross-Agregado (Sagas/Procesos) - Actualizadas v2.1

| Proceso | Agregados Involucrados | Descripción |
|---------|------------------------|-------------|
| ConvertirCarritoAVenta | Carrito, Inventario, Venta, DocFiscal | Verificar disponibilidad → Excluir no disponibles → Notificar exclusiones → Reservar inventario → Crear Venta → Marcar carrito convertido |
| CrearCuentaCliente | Cliente, ListaDeseos, PreferenciaNotificacion | Crear cliente → Crear lista deseos default → Inicializar preferencias |
| NotificarStockBajo | Inventario, ListaDeseos, Notificacion | Detectar stock bajo → Buscar en listas de deseos → Crear notificaciones según preferencias |
| NotificarPromocion | Producto, ListaDeseos, Notificacion | Producto en promoción → Buscar en listas → Crear notificaciones |
| ProcesarReintentosNotificacion | Notificacion | Job periódico que reintenta envíos fallidos |

---

### 6.5 Detalle: ConvertirCarritoAVenta

Este es el proceso más complejo introducido en v2.1:

```
1. Obtener Carrito ACTIVO del cliente
2. Para cada ItemCarrito:
   a. Verificar disponibilidad en Inventario
   b. Si no disponible: marcar para exclusión
3. Si hay exclusiones:
   a. Crear evento ItemsExcluidosPorDisponibilidad
   b. Crear notificación ITEMS_EXCLUIDOS_CARRITO
   c. Preguntar al cliente si desea continuar
4. Si cliente cancela: FIN
5. Para cada ítem disponible:
   a. Obtener precio vigente del catálogo
   b. Reservar inventario (inicio ventana 20 min)
6. Crear Venta con líneas
7. Actualizar Carrito:
   a. estado = CONVERTIDO
   b. fecha_conversion = ahora
   c. venta_id = nueva venta
8. Continuar con flujo normal de confirmación de venta
```

**Puntos críticos**:
- Los pasos 5-7 deben ser atómicos
- Si falla reserva de cualquier ítem, liberar reservas anteriores
- La ventana de 20 minutos inicia al reservar

---

## 7. Riesgos Técnicos

### 7.1 Nuevos Riesgos v2.1

#### 7.1.1 Frustración por Ítems No Disponibles al Pagar

**Escenario**: Cliente agrega productos al carrito, espera días, al pagar algunos están agotados.

**Riesgo**: Mala experiencia de usuario.

**Mitigación recomendada**:
- Mostrar indicadores de disponibilidad en carrito (actualización periódica)
- Alertas opcionales cuando stock baja (si cliente lo habilita)
- Mensaje claro y empático al excluir ítems
- Ofrecer alternativas o agregar a lista de deseos

---

#### 7.1.2 Volumen de Notificaciones

**Escenario**: Producto popular entra en promoción, miles de clientes lo tienen en listas de deseos.

**Riesgo**: Sobrecarga del sistema de notificaciones.

**Mitigación recomendada**:
- Procesamiento asíncrono de notificaciones masivas
- Rate limiting por tipo de notificación
- Cola de prioridad (transaccionales primero)
- Batch processing para notificaciones de lista de deseos

---

#### 7.1.3 Listas de Deseos con Productos Descontinuados

**Escenario**: Productos descontinuados permanecen indefinidamente en listas.

**Riesgo**: Listas acumulan ítems obsoletos, desperdicio de almacenamiento.

**Mitigación recomendada**:
- No eliminar automáticamente (decisión del dominio)
- Marcar visualmente como no disponible
- Notificación opcional de productos descontinuados
- Considerar limpieza de listas archivadas después de X meses

---

#### 7.1.4 Carritos Persistentes Acumulados

**Escenario**: Clientes inactivos con carritos que nunca se convierten.

**Riesgo**: Datos obsoletos, impacto en consultas.

**Mitigación recomendada**:
- NO eliminar carritos automáticamente (pueden reactivarse)
- Índices optimizados para filtrar solo ACTIVOS
- Posible política futura de "archivar" carritos muy antiguos

---

#### 7.1.5 Concurrencia en Creación de Carrito

**Escenario**: Cliente hace clic rápido en "agregar al carrito" desde múltiples pestañas, se intenta crear múltiples carritos.

**Riesgo**: Violación de regla "un carrito activo por cliente".

**Mitigación obligatoria**:
- Constraint único a nivel de base de datos: (cliente_id, estado='ACTIVO')
- Verificar y crear en transacción serializable
- En caso de conflicto, retornar carrito existente

---

### 7.2 Riesgos Existentes - Impacto v2.1

#### 7.2.1 Race Condition en Reservas (Ampliado)

**Nuevo escenario**: Múltiples clientes convierten carritos con el mismo producto al mismo tiempo.

**Mitigación adicional**:
- El proceso de conversión Carrito→Venta debe manejar gracefully la falta de stock
- Si la reserva falla, excluir el ítem y notificar al cliente
- No fallar toda la transacción por un ítem

---

### 7.3 Tabla Resumen de Riesgos v2.1

| Riesgo | Severidad | Probabilidad | Mitigación |
|--------|-----------|--------------|------------|
| Frustración ítems no disponibles | Media | Alta | Indicadores en tiempo real, notificaciones |
| Volumen notificaciones | Alta | Media | Procesamiento asíncrono, rate limiting |
| Listas con productos obsoletos | Baja | Alta | Marcar visualmente, no eliminar |
| Carritos acumulados | Baja | Alta | Índices optimizados |
| Concurrencia creación carrito | Media | Media | Constraint único + transacción |

---

## 8. Ajustes Sugeridos al Dominio

### 8.1 Clarificación: Tiempo de Vida del Carrito Físico

**Fricción detectada**: El dominio no especifica cuándo un Carrito FISICO se considera abandonado.

**Impacto**: Carritos físicos podrían quedar ACTIVOS indefinidamente.

**Sugerencia**: 
> Agregar en sección 3.18: "Un Carrito FISICO se considera abandonado si no se convierte a Venta dentro de la sesión de atención del empleado. El sistema puede marcar automáticamente como ABANDONADO los carritos físicos sin actividad después de [PARAMETRO] horas."

**Parámetro sugerido**: `HORAS_EXPIRACION_CARRITO_FISICO` (default: 4)

---

### 8.2 Clarificación: Límite de Listas de Deseos

**Fricción detectada**: El dominio dice "No existe límite de listas por cliente" pero esto podría ser problemático.

**Impacto**: Un cliente podría crear miles de listas.

**Sugerencia**: Aunque el dominio permite ilimitadas, sugerir un límite razonable configurable.

**Parámetro sugerido**: `MAX_LISTAS_DESEOS_POR_CLIENTE` (default: 50)

---

### 8.3 Clarificación: Notificación de Producto Disponible Nuevamente

**Fricción detectada**: El dominio menciona que se notifica cuando un producto vuelve a estar disponible, pero no define el trigger exacto.

**Impacto**: Podría generar notificaciones falsas si el stock fluctúa.

**Sugerencia**:
> Agregar en sección 3.20: "La notificación de 'producto disponible nuevamente' se envía una sola vez por ítem en lista de deseos, cuando el stock pasa de 0 a >0. Si el producto vuelve a agotarse y luego se reabastece, se envía una nueva notificación."

---

### 8.4 Sin Fricción (Confirmación)

Las siguientes áreas de las nuevas entidades están bien definidas:
- Carrito no reserva inventario
- Precio se fija al iniciar pago
- Un carrito activo por cliente
- Lista por defecto automática
- Notificaciones transaccionales obligatorias
- Canal inicial solo in-app
- Política de 3 reintentos

---

## 9. Decisiones Arquitectónicas

### 9.1 Decisiones Difíciles de Revertir v2.1

| Decisión | Justificación | Alternativa Descartada | Costo de Cambio |
|----------|---------------|------------------------|-----------------|
| Carrito NO reserva inventario | Decisión congelada dominio v2.1 | Reservar al agregar | Muy Alto |
| Múltiples listas de deseos por cliente | Flexibilidad para organización | Una lista única | Alto |
| Notificaciones solo in-app inicialmente | Simplicidad, evitar complejidad SMTP/SMS | Multicanal desde inicio | Medio |
| Precio referencial en ItemCarrito | Balance entre UX y consistencia | Sin precio en carrito | Bajo |
| Notificación vinculada a evento de dominio | Trazabilidad obligatoria | Notificaciones sin origen | Alto |

---

### 9.2 Decisiones Reversibles

| Decisión | Puede Cambiarse A | Esfuerzo |
|----------|-------------------|----------|
| Límite de reintentos (3) | Otro número | Bajo |
| Intervalo de reintento (5 min) | Otro intervalo | Bajo |
| Umbral stock bajo (10) | Otro número | Bajo |
| Canal in-app | Agregar email/SMS/push | Medio |

---

### 9.3 Supuestos Arquitectónicos v2.1

1. **Notificaciones asíncronas**: Las notificaciones se procesan en background, no bloquean operaciones principales.

2. **Caché de disponibilidad**: Para mostrar disponibilidad en carrito/lista sin impactar base de datos, se puede implementar caché con invalidación por eventos de inventario.

3. **Índices específicos**: Se requieren índices optimizados para consultas de notificaciones pendientes y listas de deseos por producto.

4. **Job de reintentos**: Debe existir un proceso periódico (cada minuto) que reintente notificaciones fallidas.

---

## 10. Matriz de Trazabilidad

### 10.1 Entidades del Dominio v2.1 → Entidades de Persistencia

| Entidad Dominio (Sección) | Entidad Persistencia | Agregado |
|---------------------------|---------------------|----------|
| Carrito (3.18) | Carrito, ItemCarrito | Carrito |
| Lista de Deseos (3.19) | ListaDeseos, ItemListaDeseos | ListaDeseos |
| Notificación (3.20) | Notificacion | Notificación |
| Cliente - Preferencias (3.6) | PreferenciaNotificacion | Cliente |

### 10.2 Reglas de Negocio v2.1 → Implementación

| Regla (Sección) | Implementación |
|-----------------|----------------|
| Carrito no reserva (3.10.1) | Sin interacción Carrito↔Inventario |
| Un carrito activo por cliente (3.18) | Constraint único (cliente_id, estado='ACTIVO') |
| Solo CON_CUENTA tiene carrito digital (3.18) | Validación en CrearCarrito |
| Una lista por defecto (3.19) | Trigger o validación en cambio de defecto |
| Notif transaccionales obligatorias (3.20) | Skip verificación de preferencias para categoría TRANSACCIONAL |
| 3 reintentos (3.20) | Parámetro MAX_REINTENTOS_NOTIFICACION |

### 10.3 Eventos de Dominio v2.1 → Persistencia

| Evento (Sección 5) | Trigger de Notificación | Datos clave |
|--------------------|------------------------|-------------|
| CarritoCreado | No | cliente_id, tipo |
| ProductoAgregadoACarrito | No | carrito_id, item |
| CarritoConvertidoAVenta | No | carrito_id, venta_id |
| ItemsExcluidosPorDisponibilidad | ITEMS_EXCLUIDOS_CARRITO | items excluidos, razones |
| ListaDeseosCreada | No | cliente_id, nombre |
| ProductoAgregadoAListaDeseos | No | lista_id, item |
| ProductoDeListaDeseosEnPromocion | PRODUCTO_EN_PROMOCION | producto_id, clientes afectados |
| ProductoDeListaDeseosBajoStock | PRODUCTO_BAJO_STOCK | producto_id, stock actual |
| ProductoDeListaDeseosAgotado | PRODUCTO_AGOTADO | producto_id |
| ProductoDeListaDeseosDisponibleNuevamente | PRODUCTO_DISPONIBLE_NUEVAMENTE | producto_id |
| StockBajoDetectado | STOCK_BAJO (empleados) | producto_id, cantidad |
| NotificacionCreada | N/A | tipo, destinatario |
| NotificacionEnviada | N/A | fecha envío |
| NotificacionFallida | N/A | intentos, error |

---

## Anexo A: Checklist de Implementación v2.1

### Nuevas Entidades
- [ ] Crear tabla Carrito con constraint de unicidad
- [ ] Crear tabla ItemCarrito
- [ ] Crear tabla ListaDeseos
- [ ] Crear tabla ItemListaDeseos con unicidad compuesta
- [ ] Crear tabla PreferenciaNotificacion
- [ ] Crear tabla Notificacion con índices para reintentos

### Modificaciones a Entidades Existentes
- [ ] Agregar tipo_cliente a Cliente
- [ ] Agregar carrito_origen_id a Venta
- [ ] Agregar nuevos parámetros operativos (UMBRAL_STOCK_BAJO, etc.)
- [ ] Agregar nuevo permiso VER_NOTIFICACIONES_OPERATIVAS
- [ ] Agregar categoría NOTIFICACIONES a Permiso

### Procesos Background
- [ ] Implementar job de reintentos de notificaciones (cada minuto)
- [ ] Implementar detector de stock bajo para notificaciones
- [ ] Implementar limpieza de carritos físicos expirados (opcional)

### Operaciones Críticas
- [ ] Implementar ConvertirCarritoAVenta con manejo de exclusiones
- [ ] Implementar CrearCuentaCliente con lista y preferencias default
- [ ] Implementar NotificarStockBajo con búsqueda en listas de deseos

### Índices Requeridos
- [ ] Carrito: (cliente_id, estado) único parcial donde estado='ACTIVO'
- [ ] ItemListaDeseos: (lista_deseos_id, tipo_item, item_id) único
- [ ] Notificacion: (estado, fecha_proximo_reintento) para job
- [ ] Notificacion: (destinatario_tipo, destinatario_id, estado)

---

## Anexo B: Diagrama de Nuevos Agregados (Textual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CONTEXTO EXPERIENCIA DEL CLIENTE                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              AGREGADO: CARRITO                              │    │
│  │  ┌──────────────┐                                           │    │
│  │  │   CARRITO    │◄─────────────────────────────────────┐    │    │
│  │  │   (Root)     │                                      │    │    │
│  │  └──────┬───────┘                                      │    │    │
│  │         │ 1:0..*                                       │    │    │
│  │         ▼                                              │    │    │
│  │  ┌──────────────┐         ┌──────────────┐             │    │    │
│  │  │ ItemCarrito  │────────►│  Producto/   │ (ref)       │    │    │
│  │  │              │         │   Paquete    │             │    │    │
│  │  └──────────────┘         └──────────────┘             │    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              AGREGADO: LISTA DE DESEOS                      │    │
│  │  ┌──────────────┐                                           │    │
│  │  │ LISTA_DESEOS │◄─────────────────────────────────────┐    │    │
│  │  │   (Root)     │                                      │    │    │
│  │  └──────┬───────┘                                      │    │    │
│  │         │ 1:0..*                                       │    │    │
│  │         ▼                                              │    │    │
│  │  ┌──────────────┐         ┌──────────────┐             │    │    │
│  │  │ItemListaDeseos────────►│  Producto/   │ (ref)       │    │    │
│  │  │              │         │   Paquete    │             │    │    │
│  │  └──────────────┘         └──────────────┘             │    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXTO COMUNICACIÓN                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              AGREGADO: NOTIFICACIÓN                         │    │
│  │  ┌──────────────┐                                           │    │
│  │  │ NOTIFICACION │                                           │    │
│  │  │   (Root)     │                                           │    │
│  │  └──────┬───────┘                                           │    │
│  │         │                                                    │    │
│  │         │ referencias externas                               │    │
│  │         ▼                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │    │
│  │  │  Cliente/    │  │   Evento     │  │  Entidad     │       │    │
│  │  │  Empleado    │  │   Dominio    │  │  Relacionada │       │    │
│  │  │(destinatario)│  │  (origen)    │  │  (opcional)  │       │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              RELACIONES CLIENTE ↔ NUEVAS ENTIDADES                   │
│                                                                      │
│                        ┌──────────────┐                              │
│                        │   CLIENTE    │                              │
│                        │ (CON_CUENTA) │                              │
│                        └──────┬───────┘                              │
│                               │                                      │
│           ┌───────────────────┼───────────────────┐                  │
│           │                   │                   │                  │
│           ▼                   ▼                   ▼                  │
│    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│    │   Carrito    │   │ ListaDeseos  │   │ Preferencia  │           │
│    │   (0..1)     │   │   (0..*)     │   │ Notificacion │           │
│    │   ACTIVO     │   │              │   │   (0..*)     │           │
│    └──────────────┘   └──────────────┘   └──────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Anexo C: Flujo de Conversión Carrito → Venta

```
┌─────────────────┐
│  Cliente inicia │
│      pago       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Obtener Carrito │
│     ACTIVO      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Para cada ítem │────►│   Verificar     │
│   del carrito   │     │  disponibilidad │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌───────────────┐         ┌───────────────┐
            │  Disponible   │         │ No disponible │
            └───────┬───────┘         └───────┬───────┘
                    │                         │
                    │                         ▼
                    │                 ┌───────────────┐
                    │                 │    Marcar     │
                    │                 │  exclusión    │
                    │                 └───────┬───────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                        ┌───────────────┐
                        │ ¿Hay ítems    │
                        │  excluidos?   │
                        └───────┬───────┘
                                │
                   ┌────────────┴────────────┐
                   │ SÍ                      │ NO
                   ▼                         │
           ┌───────────────┐                 │
           │   Notificar   │                 │
           │   exclusiones │                 │
           └───────┬───────┘                 │
                   │                         │
                   ▼                         │
           ┌───────────────┐                 │
           │  ¿Continuar?  │                 │
           └───────┬───────┘                 │
                   │                         │
          ┌────────┴────────┐                │
          │ NO              │ SÍ             │
          ▼                 │                │
   ┌──────────────┐         │                │
   │   Cancelar   │         └────────┬───────┘
   │   operación  │                  │
   └──────────────┘                  │
                                     ▼
                            ┌───────────────┐
                            │ Reservar inv. │
                            │ (atómico)     │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  Crear Venta  │
                            │  con líneas   │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ Marcar carrito│
                            │  CONVERTIDO   │
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │   Iniciar     │
                            │ ventana 20min │
                            └───────────────┘
```

---

## Anexo D: Flujo de Notificaciones

```
┌─────────────────┐
│  Evento de      │
│    Dominio      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ¿Genera         │
│ notificación?   │
└────────┬────────┘
         │
    ┌────┴────┐
    │ SÍ      │ NO
    ▼         ▼
┌──────────┐  (fin)
│Determinar│
│destinat. │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ ¿Categoría      │
│ TRANSACCIONAL?  │
└────────┬────────┘
         │
    ┌────┴────┐
    │ SÍ      │ NO
    │         ▼
    │    ┌─────────────────┐
    │    │ Verificar       │
    │    │ preferencias    │
    │    └────────┬────────┘
    │             │
    │        ┌────┴────┐
    │        │habilitada│ deshabilitada
    │        ▼         ▼
    │   ┌─────────┐   (fin)
    │   │         │
    └──►│ Crear   │
        │ Notif.  │
        └────┬────┘
             │
             ▼
        ┌─────────────────┐
        │ Estado=PENDIENTE│
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Intentar envío │
        │    (async)      │
        └────────┬────────┘
                 │
            ┌────┴────┐
            │ OK      │ ERROR
            ▼         ▼
     ┌──────────┐  ┌──────────────┐
     │ Estado=  │  │ intentos++   │
     │ ENVIADA  │  │              │
     └──────────┘  └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ ¿intentos <  │
                   │    máximo?   │
                   └──────┬───────┘
                          │
                     ┌────┴────┐
                     │ SÍ      │ NO
                     ▼         ▼
              ┌──────────┐  ┌──────────┐
              │ Programar│  │ Estado=  │
              │ reintento│  │ FALLIDA  │
              └──────────┘  └──────────┘
```

---

## Historial de Cambios del Documento

### Versión 2.0 (Enero 2026)

**Cambios respecto a v1.0:**

1. **Nuevas secciones completas:**
   - 2.1 Nuevas Entidades v2.1 (6 entidades)
   - 3.1 Nuevos Agregados v2.1 (Carrito, ListaDeseos, Notificación)
   - 4.1 Nuevas Relaciones v2.1
   - 5.1 Nuevos Datos Derivados v2.1
   - 7.1 Nuevos Riesgos v2.1

2. **Secciones actualizadas:**
   - 1.3 Contextos Identificados (agregados Experiencia Cliente y Comunicación)
   - 2.2 Entidades Modificadas (Cliente, Venta, ParametroOperativo, Permiso)
   - 6.4 Operaciones Cross-Agregado (nuevos procesos)
   - 10 Matriz de Trazabilidad (nuevos eventos)

3. **Nuevos anexos:**
   - Anexo B: Diagrama de Nuevos Agregados
   - Anexo C: Flujo de Conversión Carrito → Venta
   - Anexo D: Flujo de Notificaciones

---

**Versión del Documento**: 2.0  
**Basado en Dominio**: v2.1  
**Última Actualización**: Enero 2026  
**Estado**: Normativo para implementaciónrámetros operativos (UMBRAL_STOCK_BAJO, etc.)
- [ ] Agregar permiso VER_NOTIFICACIONES_OPERATIVAS
- [ ] Agregar categoría NOTIFICACIONES a permisos

### Procesos y Jobs
- [ ] Implementar proceso ConvertirCarritoAVenta
- [ ] Implementar job de reintentos de notificaciones
- [ ] Implementar proceso CrearCuentaCliente (con lista default)
- [ ] Implementar listeners para eventos de stock → notificaciones

### Índices Críticos
- [ ] Carrito: (cliente_id, estado) con filtro estado='ACTIVO'
- [ ] ItemCarrito: (carrito_id)
- [ ] ListaDeseos: (cliente_id, es_por_defecto)
- [ ] ItemListaDeseos: (lista_deseos_id), (tipo_item, item_id)
- [ ] Notificacion: (destinatario_tipo, destinatario_id, estado)
- [ ] Notificacion: (estado, fecha_proximo_reintento)

### Validaciones de Negocio
- [ ] Un carrito ACTIVO por cliente CON_CUENTA
- [ ] Carrito DIGITAL requiere cliente CON_CUENTA
- [ ] Carrito FISICO requiere empleado_id
- [ ] Solo clientes CON_CUENTA pueden tener ListaDeseos
- [ ] Exactamente una lista por defecto por cliente
- [ ] Notificaciones TRANSACCIONALES siempre se envían

---

## Anexo B: Diagrama de Entidades Nuevas v2.1

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CONTEXTO: EXPERIENCIA CLIENTE                     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              AGREGADO: CARRITO                              │   │
│  │                                                             │   │
│  │  ┌──────────────┐         ┌───────────────┐                │   │
│  │  │   CARRITO    │ 1    *  │  ItemCarrito  │                │   │
│  │  │   (Root)     │─────────│               │                │   │
│  │  └──────┬───────┘         └───────────────┘                │   │
│  │         │                                                   │   │
│  └─────────┼───────────────────────────────────────────────────┘   │
│            │                                                        │
│            │ 0..1                                                   │
│            ▼                                                        │
│  ┌─────────────────┐                                               │
│  │     Cliente     │◄──────────────────────────────────────┐       │
│  │  (tipo_cliente) │                                       │       │
│  └────────┬────────┘                                       │       │
│           │ 1                                              │       │
│           │                                                │       │
│           ▼ 0..*                                           │       │
│  ┌─────────────────────────────────────────────────────┐   │       │
│  │              AGREGADO: LISTA DESEOS                 │   │       │
│  │                                                     │   │       │
│  │  ┌──────────────┐         ┌─────────────────┐      │   │       │
│  │  │ ListaDeseos  │ 1    *  │ ItemListaDeseos │      │   │       │
│  │  │   (Root)     │─────────│                 │      │   │       │
│  │  └──────────────┘         └─────────────────┘      │   │       │
│  │                                                     │   │       │
│  └─────────────────────────────────────────────────────┘   │       │
│                                                             │       │
│  ┌─────────────────────────────────────────────────────┐   │       │
│  │         PreferenciaNotificacion                     │───┘       │
│  │         (parte del agregado Cliente)                │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXTO: COMUNICACIÓN                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              AGREGADO: NOTIFICACION                         │   │
│  │                                                             │   │
│  │  ┌───────────────────┐                                     │   │
│  │  │   NOTIFICACION    │                                     │   │
│  │  │     (Root)        │                                     │   │
│  │  │                   │                                     │   │
│  │  │ destinatario_tipo │──────► Cliente / Empleado           │   │
│  │  │ evento_origen     │──────► EventoDominio                │   │
│  │  └───────────────────┘                                     │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Anexo C: Flujo de Conversión Carrito a Venta

```
┌─────────────────┐
│ Cliente inicia  │
│     pago        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Obtener Carrito │
│     ACTIVO      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Para cada ítem │◄────────────────────────┐
│  del carrito    │                         │
└────────┬────────┘                         │
         │                                  │
         ▼                                  │
┌─────────────────┐     No                  │
│  ¿Disponible?   │─────────┐               │
└────────┬────────┘         │               │
         │ Sí               ▼               │
         │         ┌─────────────────┐      │
         │         │ Marcar para     │      │
         │         │ exclusión       │      │
         │         └────────┬────────┘      │
         │                  │               │
         ▼                  ▼               │
┌─────────────────┐  ┌─────────────────┐    │
│ Agregar a lista │  │ Agregar a lista │    │
│ de disponibles  │  │ de excluidos    │    │
└────────┬────────┘  └────────┬────────┘    │
         │                    │             │
         └──────────┬─────────┘             │
                    │                       │
                    ▼                       │
         ┌─────────────────┐                │
         │ ¿Más ítems?     │────────────────┘
         └────────┬────────┘      Sí
                  │ No
                  ▼
         ┌─────────────────┐
         │ ¿Hay excluidos? │
         └────────┬────────┘
                  │ Sí
                  ▼
         ┌─────────────────┐
         │ Crear evento    │
         │ ItemsExcluidos  │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Crear notif.    │
         │ al cliente      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ ¿Cliente desea  │───► No ───► FIN (cancelado)
         │   continuar?    │
         └────────┬────────┘
                  │ Sí
                  ▼
         ┌─────────────────┐
         │ Para cada ítem  │◄─────────────┐
         │ disponible      │              │
         └────────┬────────┘              │
                  │                       │
                  ▼                       │
         ┌─────────────────┐              │
         │ Reservar stock  │              │
         │ (20 min)        │              │
         └────────┬────────┘              │
                  │                       │
                  ▼                       │
         ┌─────────────────┐              │
         │ ¿Reserva OK?    │───► No ───► Excluir ítem
         └────────┬────────┘              │
                  │ Sí                    │
                  ▼                       │
         ┌─────────────────┐              │
         │ ¿Más ítems?     │──────────────┘
         └────────┬────────┘      Sí
                  │ No
                  ▼
         ┌─────────────────┐
         │ Crear Venta     │
         │ con líneas      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Actualizar      │
         │ Carrito:        │
         │ - CONVERTIDO    │
         │ - venta_id      │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Continuar flujo │
         │ confirmación    │
         └─────────────────┘
```

---

## Anexo D: Tipos Enumerados Nuevos v2.1

```sql
-- Tipos de cliente
CREATE TYPE tipo_cliente AS ENUM ('CON_CUENTA', 'SIN_CUENTA');

-- Carrito
CREATE TYPE tipo_carrito AS ENUM ('DIGITAL', 'FISICO');
CREATE TYPE estado_carrito AS ENUM ('ACTIVO', 'CONVERTIDO', 'ABANDONADO');

-- Lista de Deseos
CREATE TYPE estado_lista_deseos AS ENUM ('ACTIVA', 'ARCHIVADA');

-- Notificaciones
CREATE TYPE tipo_destinatario AS ENUM ('CLIENTE', 'EMPLEADO');
CREATE TYPE categoria_notificacion AS ENUM ('TRANSACCIONAL', 'LISTA_DESEOS', 'OPERATIVA');
CREATE TYPE estado_notificacion AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');
CREATE TYPE canal_notificacion AS ENUM ('IN_APP');

-- Tipos de notificación para clientes
CREATE TYPE tipo_notificacion_cliente AS ENUM (
    'VENTA_CONFIRMADA',
    'ENVIO_ACTUALIZADO', 
    'ENTREGA_CONFIRMADA',
    'CAMBIO_SOLICITADO',
    'CAMBIO_APROBADO',
    'CAMBIO_RECHAZADO',
    'CAMBIO_EJECUTADO',
    'PAGO_DIFERENCIA_PENDIENTE',
    'ITEMS_EXCLUIDOS_CARRITO',
    'PRODUCTO_EN_PROMOCION',
    'PRODUCTO_BAJO_STOCK',
    'PRODUCTO_AGOTADO',
    'PRODUCTO_DISPONIBLE_NUEVAMENTE'
);

-- Tipos de notificación para empleados
CREATE TYPE tipo_notificacion_empleado AS ENUM (
    'STOCK_BAJO',
    'CAMBIO_PENDIENTE_REVISION',
    'PRODUCTO_EN_ABANDONO',
    'ALERTA_REABASTECIMIENTO'
);
```

---

## Historial de Cambios del Documento

### Versión 2.0 (Enero 2026)

**Cambios respecto a v1.0:**

**Secciones nuevas:**
- 2.1 Nuevas Entidades v2.1 (Carrito, ItemCarrito, ListaDeseos, ItemListaDeseos, PreferenciaNotificacion, Notificacion)
- 2.2 Entidades Modificadas v2.1
- 3.1 Nuevos Agregados v2.1
- 4.1 Nuevas Relaciones v2.1
- 5.1 Nuevos Datos Derivados v2.1
- 6.1-6.3 Operaciones de nuevos agregados
- 7.1 Nuevos Riesgos v2.1
- Anexos B, C, D

**Secciones modificadas:**
- 1.1 Alcance (incluye nuevas funcionalidades)
- 1.3 Contextos (agregados Experiencia Cliente y Comunicación)
- 6.4 Operaciones Cross-Agregado (nuevos procesos)
- 10 Matriz de Trazabilidad (eventos y reglas nuevas)

**Total de entidades**: 32 (antes 26)

---

**Versión del Documento**: 2.0  
**Basado en Dominio**: v2.1  
**Última Actualización**: Enero 2026  
**Estado**: Normativo para implementación