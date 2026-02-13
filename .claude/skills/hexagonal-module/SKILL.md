---
name: hexagonal-module
description: >
  Hexagonal Architecture + DDD module patterns for store-backend.
  Trigger: When creating a new module, adding files to a module, validating file
  placement/responsibility, implementing domain/application/infrastructure layers,
  or working with ports, adapters, aggregates, repositories, or DI tokens.
license: Apache-2.0
metadata:
  author: yeiner-molina
  version: '1.0'
---

## When to Use

- Creating a new bounded context / module
- Adding a file to an existing module (need to know WHERE it goes)
- Validating if a file's responsibility matches its layer
- Implementing ports (inbound/outbound), adapters, or repositories
- Wiring DI tokens in a NestJS module
- Working with aggregates, entities, value objects, or domain events
- Mapping between layers (Domain <-> Persistence, Domain <-> DTO)
- Setting up Swagger documentation for a module

## Module File Structure (REQUIRED)

Every module follows this exact layout under `src/modules/{modulo}/`:

```
{modulo}/
├── {MODULO}_CLAUDE.md                    # Business logic spec (read FIRST)
├── {MODULO}_ENTITIES_CLAUDE.md           # Database entities spec
├── README.md
├── domain/                               # LAYER 1: CORE (zero dependencies)
│   ├── aggregates/{agregado}/
│   │   ├── {agregado}.entity.ts          # Aggregate root entity
│   │   ├── {agregado}.types.ts           # Props, Data interfaces
│   │   ├── types.ts                      # Shared enums (Const Types Pattern)
│   │   ├── {entidad-hija}.entity.ts      # Child entities (if any)
│   │   ├── {entidad-hija}.types.ts       # Child entity types
│   │   └── index.ts                      # Barrel export
│   ├── value-objects/
│   │   └── {vo}.ts                       # Immutable value objects
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── {servicio}.service.ts     # Use case INTERFACE
│   │   ├── outbound/
│   │   │   ├── repositories/            # 📁 Persistence interfaces
│   │   │   │   ├── {repo}.repository.ts
│   │   │   │   └── index.ts             # Barrel export
│   │   │   ├── external/                # 📁 Technical services (email, JWT)
│   │   │   │   ├── {servicio}.port.ts
│   │   │   │   └── index.ts
│   │   │   └── integrations/            # 📁 Other system modules
│   │   │       ├── {modulo}.port.ts
│   │   │       └── index.ts
│   │   └── tokens.ts                     # DI tokens (Symbols)
│   ├── types/                            # Data contracts (shared across ports)
│   │   ├── {dominio}.types.ts           # LoginData, LoginResult, etc.
│   │   └── index.ts
│   ├── events/
│   │   └── {evento}.event.ts             # Domain events
│   ├── exceptions/
│   │   ├── {error}.error.ts              # Domain-specific errors
│   │   └── index.ts
│   └── factories/
│       ├── {agregado}.factory.ts         # Aggregate creation (UUID v7)
│       └── index.ts
├── application/                          # LAYER 2: ORCHESTRATION
│   ├── services/
│   │   └── {servicio}-application.service.ts  # Implements inbound port
│   ├── dto/
│   │   ├── {operacion}-request.dto.ts         # Input DTO (primitives)
│   │   ├── {operacion}-request.schema.ts      # Zod 4 validation schema
│   │   └── {entidad}-response.dto.ts          # Output DTO
│   ├── mappers/
│   │   └── {entidad}.mapper.ts                # Domain <-> DTO
│   └── types/
│       └── {tipo}.types.ts                    # Application-level types
├── infrastructure/                       # LAYER 3: ADAPTERS
│   ├── controllers/
│   │   └── {controlador}.controller.ts   # HTTP adapter (NestJS)
│   ├── persistence/
│   │   ├── repositories/
│   │   │   └── {repo}-postgres.repository.ts  # Implements outbound port
│   │   ├── mappers/
│   │   │   └── prisma-{entidad}.mapper.ts     # Domain <-> Prisma
│   │   ├── types/
│   │   │   └── prisma-transaction.type.ts
│   │   └── prisma-transaction-manager.ts
│   ├── adapters/
│   │   └── {modulo}-stub.adapter.ts      # External module adapter
│   ├── jobs/
│   │   └── {modulo}-jobs.service.ts      # Background jobs
│   └── {modulo}.module.ts                # NestJS module (DI wiring)
└── docs/
    ├── decorators/
    │   ├── api-error-responses.decorator.ts
    │   └── api-{modulo}.decorator.ts     # Swagger endpoint decorators
    ├── examples/
    │   └── {modulo}.examples.ts          # Swagger example payloads
    └── swagger.config.ts
```

## Dependency Rules (STRICT)

```
✅ ALLOWED:
  domain/         → [NOTHING]  (pure, zero imports from other layers)
  application/    → domain/
  infrastructure/ → domain/ + application/

❌ FORBIDDEN:
  domain/         → application/    NEVER
  domain/         → infrastructure/ NEVER
  application/    → infrastructure/ NEVER
```

**If you need infrastructure in application** → define a PORT (interface) in `domain/ports/outbound/` and inject it.

## Decision: Where Does This File Go?

| I need to create...                         | Layer          | Path                                                                    |
| ------------------------------------------- | -------------- | ----------------------------------------------------------------------- |
| Business rules, invariants, state machine   | domain         | `domain/aggregates/{agregado}/{agregado}.entity.ts`                     |
| Shared enums for a bounded context          | domain         | `domain/aggregates/{agregado}/types.ts`                                 |
| Props/Data interfaces for entity methods    | domain         | `domain/aggregates/{agregado}/{agregado}.types.ts`                      |
| **Data contracts shared across ports**      | domain         | `domain/types/{dominio}.types.ts`                                       |
| Immutable value (Money, Cantidad, Version)  | domain         | `domain/value-objects/{vo}.ts`                                          |
| Use case contract (WHAT the module does)    | domain         | `domain/ports/inbound/{servicio}.service.ts`                            |
| **Repository contract (persistence)**       | domain         | `domain/ports/outbound/repositories/{repo}.repository.ts`               |
| **Technical service (email, JWT, hashing)** | domain         | `domain/ports/outbound/external/{servicio}.port.ts`                     |
| **Other module integration**                | domain         | `domain/ports/outbound/integrations/{modulo}.port.ts`                   |
| DI injection tokens                         | domain         | `domain/ports/tokens.ts`                                                |
| Domain event                                | domain         | `domain/events/{evento}.event.ts`                                       |
| Domain exception                            | domain         | `domain/exceptions/{error}.error.ts`                                    |
| Entity factory (UUID v7 generation)         | domain         | `domain/factories/{agregado}.factory.ts`                                |
| Use case implementation (orchestration)     | application    | `application/services/{svc}-application.service.ts`                     |
| HTTP input contract                         | application    | `application/dto/{op}-request.dto.ts`                                   |
| Zod validation schema                       | application    | `application/dto/{op}-request.schema.ts`                                |
| HTTP output contract                        | application    | `application/dto/{entidad}-response.dto.ts`                             |
| Domain <-> DTO mapper                       | application    | `application/mappers/{entidad}.mapper.ts`                               |
| HTTP controller                             | infrastructure | `infrastructure/controllers/{ctrl}.controller.ts`                       |
| Prisma repository implementation            | infrastructure | `infrastructure/persistence/repositories/{repo}-postgres.repository.ts` |
| Domain <-> Prisma mapper                    | infrastructure | `infrastructure/persistence/mappers/prisma-{entidad}.mapper.ts`         |
| Stub/adapter for external module            | infrastructure | `infrastructure/adapters/{modulo}-stub.adapter.ts`                      |
| Background job                              | infrastructure | `infrastructure/jobs/{modulo}-jobs.service.ts`                          |
| NestJS module with DI                       | infrastructure | `infrastructure/{modulo}.module.ts`                                     |
| Swagger decorators                          | docs           | `docs/decorators/api-{modulo}.decorator.ts`                             |
| Swagger examples                            | docs           | `docs/examples/{modulo}.examples.ts`                                    |

## Naming Conventions

| Concept                 | Convention                                                      | Example                                                |
| ----------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Port (interface)**    | `{Concepto}Service` / `{Concepto}Repository` / `{Concepto}Port` | `VentaService`, `InventarioRepository`, `CatalogoPort` |
| **Application Service** | `{Concepto}ApplicationService`                                  | `InventarioApplicationService`                         |
| **Adapter**             | `{Concepto}{Tecnologia}Adapter`                                 | `InventarioHttpAdapter`                                |
| **Repository impl**     | `{Concepto}PostgresRepository`                                  | `InventarioPostgresRepository`                         |
| **DI Token**            | `{CONCEPTO}_{TIPO}_TOKEN` (Symbol)                              | `INVENTARIO_SERVICE_TOKEN`                             |
| **Domain Event**        | `{Agregado}{Accion}Event`                                       | `InventarioReservadoEvent`                             |
| **Domain Exception**    | `{Descripcion}Error`                                            | `StockInsuficienteError`                               |
| **Factory**             | `{Agregado}Factory`                                             | `InventarioFactory`                                    |
| **Value Object**        | `{Concepto}` (file: `{vo}.ts`)                                  | `Cantidad`, `Version`                                  |
| **Prisma Mapper**       | `Prisma{Entidad}Mapper`                                         | `PrismaInventarioMapper`                               |
| **DTO Mapper**          | `{Entidad}Mapper`                                               | `InventarioMapper`                                     |

```typescript
// ✅ CORRECT: No "I" prefix on interfaces
export interface InventarioRepository { ... }
export interface InventarioService { ... }

// ❌ WRONG: C#/Java convention
export interface IInventarioRepository { ... }
```

## Aggregate Rules (DDD)

1. **One aggregate = one repository**. Child entities do NOT get their own repositories.
2. **Aggregate root** is the ONLY entry point from outside.
3. **Transactions** span the ENTIRE aggregate (atomic).
4. **Strong consistency** within an aggregate, **eventual consistency** between aggregates.
5. **Factory methods** for creation (never `new Entity()` from outside).
6. **All IDs** are UUID v7 via `IdGenerator.generate()`.

```typescript
// ✅ CORRECT: Declarative persistence options for child entities
export interface GuardarInventarioOptions {
  reservas?: {
    nuevas?: Reserva[];
    actualizadas?: Reserva[];
  };
  movimientos?: MovimientoInventario[];
}

await repo.guardar(inventario, {
  reservas: { nuevas: [reserva] },
});

// ❌ WRONG: Separate repositories for child entities
export interface ReservaRepository { ... }  // Violates DDD
```

## DI Token Pattern (NestJS)

```typescript
// domain/ports/tokens.ts
export const INVENTARIO_SERVICE_TOKEN = Symbol('INVENTARIO_SERVICE');
export const INVENTARIO_REPOSITORY_TOKEN = Symbol('INVENTARIO_REPOSITORY');
export const EVENT_BUS_TOKEN = Symbol('EVENT_BUS');

// infrastructure/{modulo}.module.ts
@Module({
  controllers: [InventarioController],
  providers: [
    {
      provide: INVENTARIO_SERVICE_TOKEN,
      useClass: InventarioApplicationService,
    },
    {
      provide: INVENTARIO_REPOSITORY_TOKEN,
      useClass: InventarioPostgresRepository,
    },
    {
      provide: EVENT_BUS_TOKEN,
      useClass: EventBusConsoleAdapter,
    },
  ],
  exports: [INVENTARIO_SERVICE_TOKEN],
})
export class InventarioModule {}
```

## Three Separate Models (REQUIRED)

Every entity has THREE representations that evolve independently:

```
Domain Model          Prisma Model           DTO Model
(rich, type-safe)     (DB-optimized)         (API-optimized)

class Inventario {    model Inventario {     interface InventarioResponseDto {
  id: UUID              id String              id: string
  cantidad: Cantidad    cantidad_disponible    cantidadDisponible: number
}                       Int                    fechaActualizacion: string
                      }                      }
```

**Mappers connect them**:

- `infrastructure/persistence/mappers/prisma-{entidad}.mapper.ts` → Domain <-> Prisma
- `application/mappers/{entidad}.mapper.ts` → Domain <-> DTO

## Outbound Ports Organization

Outbound ports are organized into **three subcategories** by purpose:

### 1. `outbound/repositories/` - Persistence

Interfaces for persisting and retrieving aggregates from the database.

```typescript
// domain/ports/outbound/repositories/cuenta-usuario.repository.ts
export interface CuentaUsuarioRepository {
  guardar(cuenta: CuentaUsuario): Promise<void>;
  buscarPorId(id: string): Promise<CuentaUsuario | null>;
}

// Implemented in: infrastructure/persistence/repositories/cuenta-usuario-postgres.repository.ts
```

**When to use**: For database operations (save, find, update aggregates).

### 2. `outbound/external/` - Technical Services

Interfaces for external technical infrastructure (email, JWT, password hashing, etc).

```typescript
// domain/ports/outbound/external/email-service.port.ts
export interface EmailService {
  enviarVerificacion(email: string, token: string): Promise<void>;
}

// domain/ports/outbound/external/password-hasher.port.ts
export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

// Implemented in: infrastructure/adapters/bcrypt-password-hasher.adapter.ts
```

**When to use**: For technical services that are NOT part of business domain (auth, notifications, crypto).

### 3. `outbound/integrations/` - Other System Modules

Interfaces for interacting with other bounded contexts in the system.

```typescript
// domain/ports/outbound/integrations/cliente.port.ts
export interface ClientePort {
  buscarPorId(id: string): Promise<ClienteData | null>;
}

// domain/ports/outbound/integrations/configuracion.port.ts
export interface ConfiguracionPort {
  obtenerDuracionSesion(): Promise<number>;
}

// Implemented in: infrastructure/adapters/cliente-http.adapter.ts
```

**When to use**: For cross-module communication (other bounded contexts).

### Barrel Exports (index.ts)

Each subcategory has an `index.ts` for clean imports:

```typescript
// ✅ Clean imports (from subcategory)
import { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories';
import { EmailService } from '../../domain/ports/outbound/external';
import { ClientePort } from '../../domain/ports/outbound/integrations';

// ❌ Verbose (full file path)
import { CuentaUsuarioRepository } from '../../domain/ports/outbound/repositories/cuenta-usuario.repository';
```

## Types vs DTOs

| Aspect           | Types (domain)                                                              | DTOs (application)                    |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| **Location**     | `domain/types/` (shared) or `domain/aggregates/{e}/{e}.types.ts` (internal) | `application/dto/{op}-request.dto.ts` |
| **Types used**   | Domain enums, value objects                                                 | Primitives (string, number, boolean)  |
| **Purpose**      | Port contracts, entity methods                                              | HTTP input/output                     |
| **Validated by** | Entity invariants                                                           | Zod schemas                           |
| **Scope**        | Internal to domain layer                                                    | Exposed to clients (API)              |

**Use `domain/types/`** for data contracts shared between ports (e.g., `LoginData`, `LoginResult`).
**Use `domain/aggregates/{e}/*.types.ts`** for aggregate-specific contracts (e.g., `ReservarInventarioProps`).

## Checklist: Creating a New Module

1. Read `{MODULO}_CLAUDE.md` (business logic)
2. Read `{MODULO}_ENTITIES_CLAUDE.md` (entities)
3. Run `./scripts/create-hexagonal-module.sh {modulo}` (scaffolding)
4. **DOMAIN** first:
   - [ ] Enums in `domain/aggregates/{agregado}/types.ts` (Const Types Pattern)
   - [ ] Internal types in `domain/aggregates/{agregado}/{agregado}.types.ts`
   - [ ] Shared types in `domain/types/{dominio}.types.ts`
   - [ ] Entity in `domain/aggregates/{agregado}/{agregado}.entity.ts`
   - [ ] Factory in `domain/factories/{agregado}.factory.ts`
   - [ ] Value objects in `domain/value-objects/`
   - [ ] Inbound ports in `domain/ports/inbound/`
   - [ ] Outbound ports organized:
     - [ ] `domain/ports/outbound/repositories/` (persistence)
     - [ ] `domain/ports/outbound/external/` (technical services)
     - [ ] `domain/ports/outbound/integrations/` (other modules)
     - [ ] Each with `index.ts` barrel export
   - [ ] Tokens in `domain/ports/tokens.ts`
   - [ ] Events in `domain/events/`
   - [ ] Exceptions in `domain/exceptions/`
5. **APPLICATION** second:
   - [ ] DTOs + Zod schemas in `application/dto/`
   - [ ] Mappers in `application/mappers/`
   - [ ] Service in `application/services/`
6. **INFRASTRUCTURE** last:
   - [ ] Prisma mappers in `infrastructure/persistence/mappers/`
   - [ ] Repository in `infrastructure/persistence/repositories/`
   - [ ] Controller in `infrastructure/controllers/`
   - [ ] Module (DI) in `infrastructure/{modulo}.module.ts`
   - [ ] Swagger docs in `docs/`
7. **TESTS**:
   - [ ] Unit tests for domain (NO mocks)
   - [ ] Integration tests for application (mock PORTS, not implementations)
   - [ ] E2E tests for full stack

## Reference Implementation

The **inventario** module is the complete reference. When in doubt, check:

```
src/modules/inventario/
```

## Resources

- **Full architecture guide**: [docs/arquitectura/ARQUITECTURA_HEXAGONAL.md](../../../docs/arquitectura/ARQUITECTURA_HEXAGONAL.md)
- **Visual diagrams**: [docs/arquitectura/ARQUITECTURA_DIAGRAMA.md](../../../docs/arquitectura/ARQUITECTURA_DIAGRAMA.md)
- **Swagger guide**: [docs/patrones/SWAGGER_INTEGRATION_GUIDE.md](../../../docs/patrones/SWAGGER_INTEGRATION_GUIDE.md)
- **UUID v7 guide**: [docs/patrones/UUID_V7_GUIDE.md](../../../docs/patrones/UUID_V7_GUIDE.md)
