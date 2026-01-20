# Entidades del Módulo CATÁLOGO

**Contexto**: CATALOGO  
**Archivo de Lógica**: `CATALOGO_CLAUDE.md`

---

## Entidades del Módulo

1. Categoria
2. Producto
3. Paquete
4. PaqueteComponente

---

## 1. Categoria

| Campo                | Tipo         | Restricciones             | Descripción                    |
| -------------------- | ------------ | ------------------------- | ------------------------------ |
| `id`                 | uuid         | PK                        | Identificador único            |
| `nombre`             | varchar(100) | not null                  | Nombre de la categoría         |
| `descripcion`        | text         | nullable                  | Descripción detallada          |
| `categoria_padre_id` | uuid         | FK nullable               | Categoría superior (jerarquía) |
| `orden`              | int          | not null, default: 0      | Orden de visualización         |
| `estado`             | enum         | not null, default: ACTIVO | ACTIVO, INACTIVO               |
| `fecha_creacion`     | timestamp    | not null, default: now()  | Fecha de creación              |

**Constraints**:

- FK: `categoria_padre_id` → `categoria(id)`
- Unique: `(nombre, categoria_padre_id)` (nombre único por nivel)

---

## 2. Producto

| Campo                | Tipo          | Restricciones             | Descripción                     |
| -------------------- | ------------- | ------------------------- | ------------------------------- |
| `id`                 | uuid          | PK                        | Identificador único             |
| `sku`                | varchar(50)   | not null, unique          | Código único de producto        |
| `nombre`             | varchar(200)  | not null                  | Nombre del producto             |
| `descripcion`        | text          | nullable                  | Descripción detallada           |
| `categoria_id`       | uuid          | FK                        | Categoría del producto          |
| `proveedor_id`       | uuid          | FK                        | Proveedor del producto          |
| `precio_venta`       | decimal(12,2) | not null                  | Precio de venta                 |
| `es_elegible_cambio` | boolean       | not null, default: true   | Si puede cambiarse              |
| `atributos`          | json          | nullable                  | Talla, color, etc.              |
| `imagenes`           | json          | nullable                  | Array de URLs                   |
| `estado`             | enum          | not null, default: ACTIVO | ACTIVO, INACTIVO, DESCONTINUADO |
| `fecha_creacion`     | timestamp     | not null, default: now()  |                                 |
| `fecha_modificacion` | timestamp     | not null                  |                                 |

**Constraints**:

- FK: `categoria_id` → `categoria(id)`
- FK: `proveedor_id` → `proveedor_bienes(id)`
- Unique: `sku`
- Check: `precio_venta > 0`

**Índices**:

```sql
CREATE UNIQUE INDEX idx_producto_sku ON producto (sku);
CREATE INDEX idx_producto_categoria ON producto (categoria_id);
CREATE INDEX idx_producto_estado ON producto (estado);
```

---

## 3. Paquete

| Campo                | Tipo          | Restricciones             | Descripción                     |
| -------------------- | ------------- | ------------------------- | ------------------------------- |
| `id`                 | uuid          | PK                        | Identificador único             |
| `sku`                | varchar(50)   | not null, unique          | Código único de paquete         |
| `nombre`             | varchar(200)  | not null                  | Nombre del paquete              |
| `descripcion`        | text          | nullable                  | Descripción                     |
| `precio_venta`       | decimal(12,2) | not null                  | Precio del combo                |
| `imagenes`           | json          | nullable                  | Array de URLs                   |
| `estado`             | enum          | not null, default: ACTIVO | ACTIVO, INACTIVO, DESCONTINUADO |
| `fecha_creacion`     | timestamp     | not null, default: now()  |                                 |
| `fecha_modificacion` | timestamp     | not null                  |                                 |

**Constraints**:

- Unique: `sku`
- Check: `precio_venta > 0`

---

## 4. PaqueteComponente

| Campo            | Tipo      | Restricciones            | Descripción              |
| ---------------- | --------- | ------------------------ | ------------------------ |
| `id`             | uuid      | PK                       | Identificador único      |
| `paquete_id`     | uuid      | FK, not null             | Paquete al que pertenece |
| `producto_id`    | uuid      | FK, not null             | Producto componente      |
| `cantidad`       | int       | not null                 | Cantidad del producto    |
| `fecha_creacion` | timestamp | not null, default: now() |                          |

**Constraints**:

- FK: `paquete_id` → `paquete(id)`
- FK: `producto_id` → `producto(id)`
- Unique: `(paquete_id, producto_id)`
- Check: `cantidad > 0`

**Nota**: Esta tabla es INSERT-only (inmutable).

---

## Enums

```sql
CREATE TYPE estado_producto AS ENUM ('ACTIVO', 'INACTIVO', 'DESCONTINUADO');
```

---

## Ejemplo de Datos

### Atributos de Producto (JSON)

```json
{
  "talla": "M",
  "color": "azul marino",
  "material": "algodón 100%",
  "genero": "unisex"
}
```

### Imágenes (JSON)

```json
[
  "https://cdn.tienda.com/productos/img1.jpg",
  "https://cdn.tienda.com/productos/img2.jpg"
]
```

---

**Referencia**: Ver `CATALOGO_CLAUDE.md` para lógica de negocio.
