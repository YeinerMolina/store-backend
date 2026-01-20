# Módulo CATÁLOGO

**Contexto**: CATALOGO  
**Responsabilidad**: Definición de productos vendibles y su organización  
**Archivo de Entidades**: `CATALOGO_ENTITIES_CLAUDE.md`

---

## Visión del Módulo

El módulo CATÁLOGO gestiona todo lo relacionado con los productos que la tienda ofrece para la venta. Define QUÉ se vende, pero NO cuánto hay en stock (eso es responsabilidad de INVENTARIO).

El catálogo soporta dos tipos de ítems vendibles:

- **Productos**: Artículos individuales (ej: camiseta, pantalón)
- **Paquetes**: Combos de productos con precio especial (ej: outfit completo)

---

## Responsabilidades del Módulo

### Responsabilidades Principales

1. **Gestión de Categorías**: Jerarquía de clasificación de productos
2. **Gestión de Productos**: Alta, baja, modificación de productos individuales
3. **Gestión de Paquetes**: Combos de productos con precio unitario
4. **Control de Precios**: Definición y actualización de precios de venta
5. **Información de Producto**: Descripciones, imágenes, atributos

### Responsabilidades Fuera del Alcance

- **Inventario**: Ver módulo INVENTARIO
- **Proveedores**: Ver módulo IDENTIDAD
- **Ventas**: Ver módulo COMERCIAL

---

## Agregados

### Agregado: Categoria

**Root**: Categoria

**Invariantes**:

- Una categoría puede tener subcategorías (estructura jerárquica)
- No se permite eliminación física
- Una categoría padre no puede estar INACTIVA si tiene hijos ACTIVOS

### Agregado: Producto

**Root**: Producto  
**Entidades**: Ninguna (atómico)

**Invariantes**:

- SKU único en todo el sistema
- Un producto pertenece a UNA categoría
- El precio debe ser > 0
- Un producto vinculado a un proveedor de bienes

### Agregado: Paquete

**Root**: Paquete  
**Entidades**: PaqueteComponente

**Invariantes**:

- SKU único en todo el sistema
- Un paquete debe tener AL MENOS un componente
- Los componentes son INMUTABLES (INSERT-only)
- El precio del paquete es libre (no necesariamente suma de componentes)

---

## Casos de Uso

### CU-CAT-01: Crear Categoría

**Actor**: Empleado (con permiso GESTIONAR_CATALOGO)

**Flujo**:

1. Empleado proporciona nombre, descripción, categoría padre (opcional), orden
2. Sistema valida que nombre sea único dentro del mismo nivel jerárquico
3. Sistema crea categoría con estado ACTIVO
4. Evento: `CategoriaCreada`

---

### CU-CAT-02: Crear Producto

**Actor**: Empleado (con permiso GESTIONAR_CATALOGO)

**Precondiciones**:

- La categoría debe existir
- El proveedor debe existir

**Flujo**:

1. Empleado proporciona: SKU, nombre, descripción, categoría, proveedor, precio, atributos (JSON)
2. Sistema valida:
   - SKU único
   - Precio > 0
   - Categoría ACTIVA
   - Proveedor ACTIVO
3. Sistema crea producto con estado ACTIVO
4. Evento: `ProductoCreado`

---

### CU-CAT-03: Crear Paquete

**Actor**: Empleado (con permiso GESTIONAR_CATALOGO)

**Flujo**:

1. Empleado proporciona: SKU, nombre, descripción, precio, lista de componentes
2. Para cada componente: producto_id, cantidad
3. Sistema valida:
   - SKU único
   - Precio > 0
   - Todos los productos componentes existen y están ACTIVOS
   - Al menos un componente
4. Sistema crea paquete + componentes (transacción atómica)
5. Evento: `PaqueteCreado`

**Restricción**: Los componentes son INMUTABLES. Si se necesita cambiar un paquete, se crea uno nuevo.

---

### CU-CAT-04: Actualizar Precio de Producto

**Actor**: Empleado (con permiso GESTIONAR_PRECIOS)

**Flujo**:

1. Empleado selecciona producto y nuevo precio
2. Sistema valida precio > 0
3. Sistema actualiza precio_venta
4. Evento: `PrecioCambiado` (con precio_anterior, precio_nuevo)

**Nota**: Afecta solo a nuevas ventas. Carritos existentes mantienen precio referencial.

---

### CU-CAT-05: Descontinuar Producto

**Actor**: Empleado (con permiso)

**Flujo**:

1. Empleado selecciona producto
2. Sistema valida que no haya reservas activas
3. Sistema cambia estado a DESCONTINUADO
4. Evento: `ProductoDescontinuado`

**Nota**: No se elimina. Puede estar en listas de deseos y carritos antiguos.

---

## Reglas de Negocio

### RN-CAT-01: SKU Único

El SKU debe ser único globalmente (productos Y paquetes comparten el espacio de SKUs).

### RN-CAT-02: Precio Positivo

Todo producto/paquete debe tener precio > 0.

### RN-CAT-03: Componentes Inmutables

Una vez creado un PaqueteComponente, no puede modificarse ni eliminarse. Solo se inactiva el paquete completo.

### RN-CAT-04: Elegibilidad para Cambio

Solo productos con `es_elegible_cambio = true` pueden ser cambiados (definido en COMERCIAL).

### RN-CAT-05: Estructura de Atributos

Los atributos (JSON) deben seguir esquema según categoría:

```json
{
  "talla": "M",
  "color": "azul",
  "material": "algodón"
}
```

---

## Eventos de Dominio

| Evento                  | Cuándo               | Payload                                      |
| ----------------------- | -------------------- | -------------------------------------------- |
| `CategoriaCreada`       | Al crear categoría   | categoria_id, nombre                         |
| `ProductoCreado`        | Al crear producto    | producto_id, sku, nombre, precio             |
| `PaqueteCreado`         | Al crear paquete     | paquete_id, sku, componentes                 |
| `PrecioCambiado`        | Al actualizar precio | item_id, tipo, precio_anterior, precio_nuevo |
| `ProductoDescontinuado` | Al descontinuar      | producto_id, sku                             |
| `PaqueteInactivado`     | Al inactivar paquete | paquete_id, sku                              |

---

## Integraciones

### Este módulo PROVEE a:

#### INVENTARIO

- Producto/Paquete: Para crear registros de inventario

#### COMERCIAL

- Producto/Paquete: Para líneas de venta
- Precios vigentes

#### PRE_VENTA

- Producto/Paquete: Para carrito y listas de deseos
- Información para mostrar (nombre, descripción, imágenes)

### Este módulo CONSUME de:

#### IDENTIDAD

- ProveedorBienes: Para vincular productos

---

## Consideraciones de Implementación

### Índices Críticos

- `producto.sku` (único)
- `paquete.sku` (único)
- `producto.categoria_id`
- `producto.estado`
- `paquete_componente.(paquete_id, producto_id)` (único)

### Validaciones

- SKU: alfanumérico, máx 50 caracteres
- Precio: decimal(12,2), debe ser > 0
- Atributos: JSON válido
- Imágenes: JSON con array de URLs

---

**Referencia**: Ver `CATALOGO_ENTITIES_CLAUDE.md` para detalles de persistencia.
