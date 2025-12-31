# AGENTS.md - Agentic Coding Guidelines

This document provides strict guidelines for agentic coding systems (such as Claude, Copilot, or other AI agents) working within this repository.

---

## 1. Build & CLI Commands

### Build

```bash
npm run build          # Compile TypeScript to JavaScript (outputs to dist/)
npm run format         # Format code with Prettier (src/**/*.ts, test/**/*.ts)
npm run lint           # Run ESLint with auto-fix enabled
```

### Development

```bash
npm run start          # Start NestJS application (production mode)
npm run start:dev      # Start with watch mode (auto-reload on file changes)
npm run start:debug    # Start with debugger on port 9229 + watch mode
```

### Testing

```bash
npm test               # Run all tests matching **/*.spec.ts (Jest, rootDir: src/)
npm test -- --watch   # Run tests in watch mode (auto-rerun on changes)
npm run test:cov      # Run tests with coverage report (outputs to coverage/)
npm test:debug        # Run single test with Node debugger (runInBand mode)
npm run test:e2e      # Run E2E tests (config: test/jest-e2e.json)
```

### Running Single Tests

**CRITICAL**: To run a specific test file:

```bash
npm test -- inventory-item.entity.spec.ts
npm test -- adjust-inventory.service.spec.ts
```

To run tests matching a pattern:

```bash
npm test -- --testNamePattern="should reserve stock"
```

### Production

```bash
npm run start:prod    # Run compiled JS from dist/main.js
```

---

## 2. Code Style & Formatting Guidelines

### Prettier Configuration

- **Single quotes**: Yes (`'string'`, not `"string"`)
- **Trailing commas**: All (`{ a: 1, b: 2, }`)
- **Tab width**: Default (2 spaces)
- **Line ending**: Auto-detected

File: `.prettierrc`

### ESLint Rules

File: `eslint.config.mjs`

**Active Rules**:

- `@typescript-eslint/no-explicit-any`: OFF (disabled for flexibility)
- `@typescript-eslint/no-floating-promises`: WARN
- `@typescript-eslint/no-unsafe-argument`: WARN
- `prettier/prettier`: ERROR with `endOfLine: "auto"`

**Parser**: TypeScript ESLint with strict type checking enabled

---

## 3. Import/Export Guidelines

### Path Resolution

- Use absolute paths from `src/` root (configured in `tsconfig.json`)
- Example: `import { InventoryItem } from '../../../shared/domain/entity'`
- Avoid relative `../../../` chains unless necessary

### Import Order (Enforced by ESLint + Prettier)

1. External dependencies (`@nestjs/*`, `typeorm`, etc.)
2. Internal absolute imports from `src/`
3. Relative imports (if unavoidable)
4. Type imports (use `import type { Type }`)

### Example

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import type { IInventoryRepository } from '../../domain/inventory.repository';
import { InventoryItem } from '../../domain/inventory-item.entity';

import { someHelper } from './helpers';
```

---

## 4. TypeScript Configuration

### Key Settings (tsconfig.json)

- **Target**: ES2023
- **Module**: nodenext
- **Strict Null Checks**: Enabled (`strictNullChecks: true`)
- **No Implicit Any**: DISABLED (`noImplicitAny: false`)
- **Experimental Decorators**: Enabled (for NestJS `@Injectable()`, etc.)
- **Emit Decorator Metadata**: Enabled (for dependency injection)

### Type Safety Rules

1. Always use `type` keyword for interface imports: `import type { Interface }`
2. Avoid `any` unless absolutely necessary (it's discouraged but allowed)
3. Use `Promise<T>` for async operations, **never** `Promise<void>` for side-effects with multiple steps
4. Domain entities should be strictly typed (use Value Objects, not primitives)

---

## 5. Naming Conventions

### Files

- **Entity/Domain**: `{name}.entity.ts` (e.g., `inventory-item.entity.ts`)
- **Repository Port**: `{name}.repository.ts` (e.g., `inventory.repository.ts`)
- **Repository Impl**: `{name}.repository.ts` in `infrastructure/persistence/`
- **Schema**: `{name}.schema.ts` (e.g., `inventory-item.schema.ts`)
- **Services**: `{action}-{entity}.service.ts` (e.g., `adjust-inventory.service.ts`)
- **Mappers**: `{name}.mapper.ts` (e.g., `inventory-item.mapper.ts`)
- **DTOs**: `{name}.dto.ts` (e.g., `inventory-item.dto.ts`)
- **Controllers**: `{entity}.controller.ts` (e.g., `inventory.controller.ts`)
- **Tests**: `{file}.spec.ts` (e.g., `inventory-item.entity.spec.ts`)

### Classes & Functions

- **Classes**: PascalCase (`InventoryItem`, `AdjustInventoryService`)
- **Methods**: camelCase (`adjustQuantity()`, `reserveStock()`)
- **Constants/Tokens**: UPPER_SNAKE_CASE (`INVENTORY_REPOSITORY_TOKEN`)
- **Private fields**: camelCase prefix with `private` keyword: `private eventPublisher: IEventPublisher`

### Event Names (Domain Events)

- Format: `{domain}.{entity}.{action}` (e.g., `inventory.stock.reserved`)
- Class name: `{Action}{Entity}Event` (e.g., `StockReservedEvent`)

### Interfaces (Ports)

- Prefix with `I`: `IInventoryRepository`, `IEventPublisher`
- Token constant: `{UPPER_NAME}_TOKEN` (e.g., `INVENTORY_REPOSITORY_TOKEN`)

---

## 6. Error Handling

### Domain Exceptions

File: `src/shared/domain/exceptions/domain.exception.ts`

**Provided Exceptions**:

- `DomainException` (base class)
- `InvalidArgumentException` (invalid input)
- `InsufficientException` (insufficient resource)
- `NotFoundException` (entity not found)

### Usage in Domain Layer

```typescript
// In Value Objects
if (!value || value.trim() === '') {
  throw new InvalidArgumentException('SKU cannot be empty');
}

// In Entities
if (!this.availableQuantity.isGreaterThanOrEqual(quantity)) {
  throw new InsufficientException(
    'Available inventory',
    quantity.value,
    available,
  );
}

// In Services
const item = await this.repository.findById(id);
if (!item) {
  throw new NotFoundException('InventoryItem', id);
}
```

### Rules

1. **Domain Layer**: Use domain exceptions for business rule violations
2. **Application Layer**: Catch domain exceptions, translate to HTTP responses
3. **Controllers**: Handle exceptions with NestJS error filters (implement later)
4. **Never swallow errors**: Always throw or propagate with context

---

## 7. Architecture & Patterns

### Hexagonal Architecture (Ports & Adapters)

```
Domain (Core Business Logic)
    ↓
Application (Use Cases/Services)
    ↓
Infrastructure (Persistence, External APIs)
    ↑
Presentation (HTTP Controllers)
```

### Module Structure (Mandatory)

Every module follows this exact pattern:

```
src/modules/{module}/
├── domain/                    # Business logic (no frameworks)
│   ├── {entity}.entity.ts
│   ├── {entity}.repository.ts (Port/Interface)
│   └── __tests__/{entity}.spec.ts
├── application/              # Orchestration
│   ├── services/{action}.service.ts
│   ├── mappers/{entity}.mapper.ts
│   └── __tests__/
├── infrastructure/           # Technical details
│   └── persistence/
│       ├── {entity}.schema.ts (TypeORM)
│       └── {entity}.repository.ts (Implementation)
├── presentation/            # HTTP layer
│   ├── dtos/{entity}.dto.ts
│   ├── {entity}.controller.ts
│   └── __tests__/
└── {module}.module.ts       # NestJS Module
```

### Key Principles

1. **No Framework in Domain**: Domain layer has ZERO dependencies on NestJS, TypeORM, etc.
2. **Dependency Inversion**: Depend on interfaces (Ports), not implementations (Adapters)
3. **Event-Driven**: Modules communicate via domain events, not direct calls
4. **Immutable Value Objects**: Use `readonly` properties
5. **Type Safety**: Leverage TypeScript to prevent invalid states

---

## 8. Testing Requirements

### Test Files Location

- Unit tests: `src/modules/{module}/{layer}/__tests__/{name}.spec.ts`
- E2E tests: `test/{feature}.e2e-spec.ts`

### Test Framework

- **Jest** (v30): Runner and assertion library
- **ts-jest**: TypeScript loader
- **supertest**: HTTP testing
- **@nestjs/testing**: NestJS testing utilities

### Coverage Expectations

- **Domain Layer**: 100% (critical logic)
- **Application Layer**: 80%+ (services, mappers)
- **Infrastructure**: 60%+ (repositories)
- **Controllers**: 70%+ (HTTP handling)

### Example Test (Domain)

```typescript
describe('InventoryItem', () => {
  it('should reserve stock when available', () => {
    const item = InventoryItem.create(
      new SKU('SKU123'),
      'product-1',
      new Quantity(100),
    );
    item.reserveStock(new Quantity(50));
    expect(item.reservedQuantity.value).toBe(50);
  });

  it('should throw if insufficient stock', () => {
    const item = InventoryItem.create(
      new SKU('SKU123'),
      'product-1',
      new Quantity(10),
    );
    expect(() => item.reserveStock(new Quantity(20))).toThrow(
      InsufficientException,
    );
  });
});
```

---

## 9. Database & TypeORM

### Schema Rules

- **Primary Key**: `@PrimaryColumn('uuid')` (UUIDs, not auto-increment)
- **Timestamps**: `@CreateDateColumn()` and `@UpdateDateColumn()`
- **Column Types**: Be explicit (`varchar`, `text`, `integer`, etc.)
- **Indexes**: Add `@Index()` for frequently queried fields
- **Unique Constraints**: `@Index(['field'], { unique: true })`

### Repository Pattern

```typescript
// Port (Interface) in domain/
export interface IInventoryRepository extends IRepository<InventoryItem> {
  findBySku(sku: SKU): Promise<InventoryItem | null>;
}

// Implementation in infrastructure/persistence/
@Injectable()
export class TypeOrmInventoryRepository implements IInventoryRepository {
  private repository: Repository<InventoryItemSchema>;

  async save(entity: InventoryItem): Promise<void> {
    const persistence = this.mapper.toPersistence(entity);
    await this.repository.upsert(persistence, ['id']);
  }
}
```

---

## 10. Dependency Injection (NestJS)

### Module Registration

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([YourEntitySchema])],
  providers: [
    YourService,
    {
      provide: YOUR_REPOSITORY_TOKEN,
      useClass: TypeOrmYourRepository, // Can be swapped in tests
    },
  ],
  exports: [YOUR_REPOSITORY_TOKEN],
})
export class YourModule {}
```

### Constructor Injection

```typescript
@Injectable()
export class YourService {
  constructor(
    @Inject(YOUR_REPOSITORY_TOKEN)
    private repository: IYourRepository,
    @Inject('EventPublisher')
    private eventPublisher: IEventPublisher,
  ) {}
}
```

### Testing Injections

Always inject interfaces/tokens, never hardcode:

```typescript
// ✅ Testable
constructor(
  @Inject('IRepository') repo: IRepository,
)

// ❌ Not testable
constructor(repo: TypeOrmRepository) {}
```

---

## 11. Domain Events

### Publishing Events

```typescript
// In domain layer, entities emit events
this.addDomainEvent(
  new StockReservedEvent(this.id, this.sku.value, quantity.value),
);

// In application layer, services publish them
await this.eventPublisher.publishMany(entity.getDomainEvents());
entity.clearDomainEvents();
```

### Subscribing to Events

```typescript
// In any service/module
this.eventEmitter.on('inventory.stock.reserved', async (event) => {
  // React to event without tight coupling
});
```

---

## 12. Common Patterns & Anti-Patterns

### ✅ DO

- Use Value Objects for domain validation
- Emit domain events for important business occurrences
- Depend on interfaces (Ports), not implementations
- Keep domain layer completely framework-agnostic
- Test domain logic extensively
- Use immutable data structures in domain

### ❌ DON'T

- Put business logic in services (it belongs in domain entities)
- Expose domain entities directly in HTTP responses (use DTOs)
- Create tight coupling between modules (use events)
- Mix async/await in domain layer (domain is pure, synchronous)
- Use `any` type (it breaks type safety)
- Skip tests for "simple" code (domain logic is never "simple")

---

## 13. Cursor Rules & AI Agent Instructions

### No Cursor/Copilot Rules Found

This repository does not have `.cursor/rules/` or `.github/copilot-instructions.md`.
Use this `AGENTS.md` as the **single source of truth** for AI agent behavior.

### Key Directives for AI Agents

1. **Respect Architecture**: Always follow module structure exactly
2. **Domain-First Thinking**: Ask "where does this logic belong?" (domain/app/infra)
3. **Type Safety**: Leverage TypeScript's type system; avoid `any`
4. **Test Coverage**: Write tests alongside code (min 80%)
5. **No Shortcuts**: If something feels hacky, it probably is
6. **Ask Before Implementing**: When uncertain about layer placement, describe the problem and ask for guidance

---

## 14. File Modification Checklist

When modifying code, ensure:

- [ ] Code compiles: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting correct: `npm run format`
- [ ] Tests pass: `npm test`
- [ ] Imports are ordered correctly
- [ ] No `any` types introduced
- [ ] Domain logic is in domain layer
- [ ] Errors are handled appropriately
- [ ] New domain events are cleared after publishing
- [ ] Interfaces use `type` keyword imports

---

## 15. Quick Reference: Commands for Agents

```bash
# After making changes
npm run lint           # Fix linting issues
npm run format         # Format code with Prettier
npm run build          # Verify TypeScript compilation
npm test               # Run all tests
npm test -- --watch   # Run tests in watch mode

# Before committing
npm run lint && npm run build && npm test
```

---

**Last Updated**: 2025-01-01  
**Framework**: NestJS 11 + TypeScript 5.7 + Jest 30 + TypeORM 0.3
