# CONFIGURACIÓN Module

**Operational Parameters & Policy Management for Retail System**

## 🎯 Quick Start

Get system configuration without code changes:

```bash
# Get parameter by business key
curl http://localhost:3000/api/configuracion/parametros/clave/DURACION_RESERVA_VENTA

# Activate new policy
curl -X PATCH http://localhost:3000/api/configuracion/politicas/{id}/publicar \
  -d '{"fechaVigenciaDesde": "2026-02-15"}'

# Get active policy
curl http://localhost:3000/api/configuracion/politicas/vigente/CAMBIOS
```

---

## Architecture

### Hexagonal Layers

```
configuracion/
├── domain/                     ← Pure business logic (NO external deps)
│   ├── aggregates/
│   │   ├── parametro-operativo/
│   │   │   └── parametro-operativo.entity.ts       ← Validation, immutability
│   │   └── politica/
│   │       └── politica.entity.ts                  ← State machine, transitions
│   ├── value-objects/
│   │   └── (enums for type safety)
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── configuracion.service.ts            ← Cases of use
│   │   └── outbound/
│   │       └── configuracion.repository.ts         ← Persistence contract
│   └── events/
│       ├── configuracion-event-type.enum.ts        ← Event type constants
│       ├── parametro-operativo-creado.event.ts
│       ├── parametro-operativo-actualizado.event.ts
│       ├── politica-creada.event.ts
│       ├── politica-publicada.event.ts
│       ├── politica-archivada.event.ts
│       └── index.ts                                ← Barrel exports
├── application/               ← Orchestration (DTOs, schemas, mappers)
│   ├── services/
│   │   └── configuracion-application.service.ts    ← Service implementation
│   ├── dto/
│   │   ├── configuracion-request.dto.ts
│   │   ├── configuracion-response.dto.ts
│   │   └── configuracion.schema.ts                 ← Zod 4 validation
│   └── mappers/
│       └── configuracion.mapper.ts                 ← DTO ↔ Domain
└── infrastructure/            ← Implementations (HTTP, DB)
    ├── controllers/
    │   └── configuracion.controller.ts             ← HTTP endpoints
    ├── persistence/
    │   ├── configuracion-postgres.repository.ts    ← Prisma implementation
    │   └── mappers/
    │       └── configuracion-persistence.mapper.ts ← Domain ↔ Prisma
    ├── tokens.ts                                   ← DI configuration
    └── configuracion.module.ts                     ← NestJS module
```

### Dependency Rules

```
ALLOWED:
  domain/        → [NOTHING] ✅
  application/   → domain/ ✅
  infrastructure/ → domain/ + application/ ✅

FORBIDDEN:
  domain/        → application/ ❌
  domain/        → infrastructure/ ❌
  application/   → infrastructure/ ❌
```

---

## Core Concepts

### ParametroOperativo

System configuration parameter without code recompilation.

**Properties:**

- `clave` (UNIQUE): Business identifier (e.g., `DURACION_RESERVA_VENTA`)
- `tipoDato`: Validation type (ENTERO|DECIMAL|BOOLEAN|TEXTO|DURACION)
- `valor`: Current value (type-validated by tipoDato)
- `valorMinimo`, `valorMaximo`: Optional constraints (numeric types)
- `requiereReinicio`: Does app restart needed?

**Example:**

```json
{
  "clave": "DURACION_RESERVA_VENTA",
  "tipoDato": "DURACION",
  "valor": "20",
  "valorMinimo": "5",
  "valorMaximo": "60"
}
```

### Politica

Versioned business policy with lifecycle management.

**Lifecycle:** BORRADOR → VIGENTE → ARCHIVADA

**Properties:**

- `tipo` (enum): CAMBIOS | ENVIOS | TERMINOS
- `version` (semantic): X.Y.Z format
- `contenido`: Full policy text
- `estado`: Current state
- `fechaVigenciaDesde`, `fechaVigenciaHasta`: Validity dates

**Key Rule:** Only ONE VIGENTE policy per type at any time.

---

## API Endpoints

### Parameters

| Endpoint                                 | Method | Purpose                |
| ---------------------------------------- | ------ | ---------------------- |
| `/configuracion/parametros`              | POST   | Create parameter       |
| `/configuracion/parametros/:id`          | PATCH  | Update value           |
| `/configuracion/parametros/:id`          | GET    | Get by ID              |
| `/configuracion/parametros/clave/:clave` | GET    | Get by business key ⭐ |
| `/configuracion/parametros`              | GET    | List all               |

### Policies

| Endpoint                                 | Method | Purpose                    |
| ---------------------------------------- | ------ | -------------------------- |
| `/configuracion/politicas`               | POST   | Create (BORRADOR state)    |
| `/configuracion/politicas/:id/publicar`  | PATCH  | Publish (BORRADOR→VIGENTE) |
| `/configuracion/politicas/:id`           | GET    | Get by ID                  |
| `/configuracion/politicas/vigente/:tipo` | GET    | Get active policy ⭐       |
| `/configuracion/politicas`               | GET    | List all                   |

---

## Database Schema

### Tables

**parametro_operativo**

```
id (UUID)               → Primary key
clave (VARCHAR UNIQUE)  → Business identifier
nombre (VARCHAR)        → Friendly name
tipoDato (enum)         → ENTERO|DECIMAL|BOOLEAN|TEXTO|DURACION
valor (VARCHAR)         → Current value
valorDefecto (VARCHAR)  → Reset value
valorMinimo (VARCHAR)   → Optional min (numeric types)
valorMaximo (VARCHAR)   → Optional max (numeric types)
modificado_por (UUID)   → FK to employee (audit trail)
fecha_modificacion      → Updated timestamp
```

**politica**

```
id (UUID)               → Primary key
tipo (enum)             → CAMBIOS|ENVIOS|TERMINOS
version (VARCHAR)       → Semantic version
contenido (TEXT)        → Full policy text
estado (enum)           → BORRADOR|VIGENTE|ARCHIVADA
fecha_vigencia_desde    → Start date
fecha_vigencia_hasta    → End date
publicado_por (UUID)    → FK to employee (audit trail)
fecha_creacion          → Creation timestamp
```

**Constraints:**

- `parametro_operativo.clave`: UNIQUE
- `politica (tipo, version)`: UNIQUE
- `politica (tipo, estado='VIGENTE')`: Only one per type (enforced in app)

---

## Type Safety

### Domain Types (Const Pattern)

```typescript
// ✅ Types from domain enums (type-safe)
const TipoDatoEnum = {
  ENTERO: 'ENTERO',
  DECIMAL: 'DECIMAL',
  BOOLEAN: 'BOOLEAN',
  TEXTO: 'TEXTO',
  DURACION: 'DURACION',
} as const;

type TipoDato = (typeof TipoDatoEnum)[keyof typeof TipoDatoEnum];
```

### DTO Types (Strings)

```typescript
// DTOs use primitive types (from HTTP)
class CrearParametroOperativoRequestDto {
  tipoDato: string; // ← String from HTTP
  valor: string; // ← Validated by Zod
}
```

### Domain Mapping

```typescript
// Controller → Application → Domain
const props: CrearParametroOperativoProps = {
  tipoDato: TipoDatoEnum.DURACION, // ← Strongly typed
  valor: '20', // ← Validated range
};
```

---

## Validation

### Zod 4 Schemas (Application Layer)

```typescript
const CrearParametroOperativoSchema = z.object({
  clave: z.string({ error: 'Clave required' }).min(1),
  tipoDato: z.enum(['ENTERO', 'DECIMAL', 'BOOLEAN', 'TEXTO', 'DURACION']),
  valor: z.string().min(1),
  valorMinimo: z.string().optional(),
  valorMaximo: z.string().optional(),
});
```

### Domain Validation (Entities)

```typescript
// Aggregate validates by tipoDato
class ParametroOperativo {
  private validarValor(valor: string): void {
    switch (this.tipoDato) {
      case 'ENTERO':
        if (!/^\d+$/.test(valor)) throw new Error('Invalid integer');
        break;
      case 'DECIMAL':
        if (!/^\d+\.\d+$/.test(valor)) throw new Error('Invalid decimal');
        break;
      // ...
    }
  }
}
```

---

## Documentation Files

| File                                               | Purpose                                  |
| -------------------------------------------------- | ---------------------------------------- |
| `./API.md`                                         | Complete API reference + patterns        |
| `./docs/examples/http-requests.md`                 | cURL and HTTP examples for all endpoints |
| `./docs/examples/parametro-operativo.examples.ts`  | TypeScript request/response examples     |
| `./docs/examples/politica.examples.ts`             | Policy lifecycle examples                |
| `./docs/decorators/api-configuracion.decorator.ts` | Swagger OpenAPI 3.0 decorators           |

---

## Common Patterns

### Pattern 1: Query Parameter Efficiently

```bash
# ✅ Direct lookup by clave (business key)
GET /api/configuracion/parametros/clave/DURACION_RESERVA_VENTA

# ❌ Avoid: List all then filter
GET /api/configuracion/parametros
```

### Pattern 2: Get Active Policy

```bash
# ✅ Direct query for VIGENTE
GET /api/configuracion/politicas/vigente/CAMBIOS

# ❌ Avoid: List all, filter by estado + tipo
GET /api/configuracion/politicas?tipo=CAMBIOS&estado=VIGENTE
```

### Pattern 3: Policy Deployment Workflow

```
1. Create in BORRADOR
2. Legal/business review (offline)
3. Publish → VIGENTE (auto-archives previous)
4. Old policy → ARCHIVADA with fechaVigenciaHasta
```

---

## Development Guide

### Adding a New Parameter

1. **Create via API:**

   ```bash
   POST /api/configuracion/parametros
   {"clave": "NEW_PARAM", "tipoDato": "ENTERO", ...}
   ```

2. **Use in code:**
   ```typescript
   const param = await configService.obtenerParametroPorClave('NEW_PARAM');
   const value = parseInt(param.valor);
   ```

### Publishing a New Policy

1. **Create BORRADOR:**

   ```bash
   POST /api/configuracion/politicas
   {"tipo": "CAMBIOS", "version": "2.0.0", "contenido": "..."}
   ```

2. **Review (manual offline process)**

3. **Publish to VIGENTE:**
   ```bash
   PATCH /api/configuracion/politicas/{id}/publicar
   {"fechaVigenciaDesde": "2026-03-01"}
   ```
   → Previous VIGENTE auto-archived

---

## Testing Strategy (PHASE 6)

```
Domain Layer Tests:
  ✓ ParametroOperativo: Validation by tipoDato, immutability
  ✓ Politica: State transitions, auto-archive behavior

Application Layer Tests:
  ✓ Services: Business logic, transaction handling
  ✓ Mappers: DTO → Domain, Domain → DTO

Infrastructure Tests:
  ✓ Repository: Persistence, type mapping
  ✓ Controller: Endpoints, error handling
```

---

## Implementation Status

| Phase | Task                     | Status |
| ----- | ------------------------ | ------ |
| 1-2   | Domain Layer             | ✅     |
| 3     | Application Layer        | ✅     |
| 4     | Infrastructure Layer     | ✅     |
| 5     | Persistence + Migrations | ✅     |
| 7     | Documentation + Swagger  | ✅     |
| 6     | Testing                  | ⏳     |

---

## Related Information

- **Architecture**: See `../../docs/arquitectura/ARQUITECTURA_HEXAGONAL.md`
- **Domain Logic**: See `CONFIGURACION_CLAUDE.md`
- **Database**: See `CONFIGURACION_ENTITIES_CLAUDE.md`
- **Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## Module Usage Examples

### From Other Modules

```typescript
// In COMERCIAL or other modules
import { CONFIGURACION_SERVICE_TOKEN } from '@configuracion/infrastructure/tokens';

@Inject(CONFIGURACION_SERVICE_TOKEN)
private configService: ConfiguracionService;

// Use in business logic
async procesarVenta() {
  const duracion = await this.configService
    .obtenerParametroPorClave('DURACION_RESERVA_VENTA');

  const minutosReserva = parseInt(duracion.valor);
  // ... use in business logic
}
```

---

**Status**: ✅ Ready for Phase 6 (Testing)  
**Last Updated**: 2026-02-02  
**Version**: 2.1.0
