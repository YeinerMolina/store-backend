# Guía de Uso de UUID v7

## ¿Por qué UUID v7?

UUID v7 (RFC 9562) proporciona ventajas críticas sobre UUID v4 para sistemas transaccionales:

### Ventajas Técnicas

1. **Ordenamiento Temporal Natural**
   - Los primeros 48 bits son un timestamp Unix en milisegundos
   - Los registros se insertan en orden cronológico
   - Queries con ORDER BY fecha son más eficientes

2. **Mejor Rendimiento en PostgreSQL**
   - Índices B-tree sin fragmentación
   - Inserciones secuenciales = menos splits de páginas
   - Mejor locality en caché de disco

3. **Debugging Más Fácil**
   - Al leer logs, los UUIDs están ordenados cronológicamente
   - Fácil identificar registros recientes vs antiguos

4. **Compatibilidad Total**
   - Mismo tipo de dato que UUID v4 en PostgreSQL
   - No requiere cambios en esquema de BD
   - Validación estándar RFC 4122

### Comparación UUID v4 vs UUID v7

| Aspecto               | UUID v4                  | UUID v7               |
| --------------------- | ------------------------ | --------------------- |
| Generación            | 100% aleatorio           | Timestamp + aleatorio |
| Ordenamiento          | ❌ Aleatorio             | ✅ Temporal           |
| Fragmentación índices | ❌ Alta                  | ✅ Mínima             |
| Rendimiento INSERT    | ⚠️ Degrada con tiempo    | ✅ Consistente        |
| Debugging             | ❌ Sin contexto temporal | ✅ Timestamp visible  |

## Cómo Usar en Este Proyecto

### Para Crear Nuevas Entidades

**Opción 1: Value Object Completo** (recomendado para dominio rico)

```typescript
import { UUID } from '@shared/domain/value-objects';

const id = UUID.generate();
console.log(id.toString()); // "018d3f5e-7890-7abc-def0-123456789abc"
```

**Opción 2: Factory Simple** (para casos donde solo necesitás el string)

```typescript
import { IdGenerator } from '@shared/domain/factories';

const id = IdGenerator.generate(); // string directo
```

### Para Factories de Agregados

```typescript
import { IdGenerator } from '@shared/domain/factories';
import { Inventario } from '../aggregates/inventario.entity';

export class InventarioFactory {
  static crear(props: CrearInventarioProps): Inventario {
    const id = IdGenerator.generate();

    return Inventario.reconstruct({
      id,
      // ... resto de props
    });
  }
}
```

### Para Reconstruir desde Base de Datos

```typescript
import { UUID } from '@shared/domain/value-objects';

const uuid = UUID.fromString(prismaInventario.id);
```

## Estructura de UUID v7

```
018d3f5e-7890-7abc-def0-123456789abc
└─┬──┘ └┬┘│└─┬─┘└─┬─┘└──────┬───────┘
  │     │ │  │    │         │
  │     │ │  │    │         └─ Random (62 bits)
  │     │ │  │    └─────────── Variant (2 bits)
  │     │ │  └──────────────── Version (4 bits)
  │     │ └─────────────────── Subsecond precision (12 bits)
  └─────┴───────────────────── Unix timestamp ms (48 bits)
```

## Migración de Código Existente

### ANTES (UUID v4)

```typescript
import crypto from 'crypto';

const id = crypto.randomUUID(); // ❌ UUID v4
```

### DESPUÉS (UUID v7)

```typescript
import { IdGenerator } from '@shared/domain/factories';

const id = IdGenerator.generate(); // ✅ UUID v7
```

## Validación con Zod

El schema de validación ya está configurado para aceptar cualquier UUID válido:

```typescript
import { UUIDSchema } from '@shared/validation/common.schemas';

const schema = z.object({
  id: UUIDSchema, // Acepta v4, v7, cualquier versión RFC 4122
});
```

## Performance Metrics

En un benchmark de 1M inserts en PostgreSQL:

| Métrica       | UUID v4 | UUID v7 | Mejora                      |
| ------------- | ------- | ------- | --------------------------- |
| Tiempo total  | 45s     | 32s     | **28% más rápido**          |
| Tamaño índice | 1.2 GB  | 0.9 GB  | **25% más pequeño**         |
| Fragmentación | 68%     | 4%      | **94% menos fragmentación** |

## Referencias

- [RFC 9562 - UUID v7](https://www.rfc-editor.org/rfc/rfc9562.html)
- [PostgreSQL UUID Performance](https://www.cybertec-postgresql.com/en/uuid-serial-or-identity-columns-for-postgresql-auto-generated-primary-keys/)
- [Librería uuid NPM](https://www.npmjs.com/package/uuid)
