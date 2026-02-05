---
name: typescript
description: >
  TypeScript strict patterns and best practices.
  Trigger: When writing TypeScript code - types, interfaces, generics.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Enums vs Const Types Pattern (Decision Tree)

| Scenario | Use | Why |
|----------|-----|-----|
| Fixed set of domain values (states, roles, categories) | `enum` | Runtime object, works with Prisma/NestJS decorators, iterable |
| Values need to be used as discriminators in switches | `enum` | Exhaustive checking, clear intent |
| Values map to DB enums (PostgreSQL) | `enum` | Direct mapping with Prisma `@map` |
| Computed or derived union from existing types | Const Types Pattern | `enum` can't express derived types |
| Need `keyof typeof` or template literal types | Const Types Pattern | `enum` values aren't indexable the same way |
| Mapping keys to different runtime values (lookup tables) | Const Types Pattern | `enum` values must equal their keys or explicit strings |

### Enum (PREFERRED — use by default)

```typescript
// ✅ PREFERRED: TypeScript enum for domain values
export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EXPIRADA = 'EXPIRADA',
  CANCELADA = 'CANCELADA',
}

// ✅ Use directly in types, parameters, switches
function procesar(estado: EstadoReserva): void {
  switch (estado) {
    case EstadoReserva.PENDIENTE:
      // ...
      break;
    case EstadoReserva.CONFIRMADA:
      // ...
      break;
  }
}

// ❌ NEVER: Direct union types (no runtime values, no autocomplete)
type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'EXPIRADA' | 'CANCELADA';
```

**Why enum by default?**
- Runtime object: iterable, usable in decorators (`@ApiProperty({ enum: EstadoReserva })`)
- Single source of truth for value AND type
- Works natively with Prisma enums and NestJS/Swagger
- Exhaustive switch checking
- Autocomplete with `EnumName.VALUE`

### Const Types Pattern (FALLBACK — when enum can't express it)

```typescript
// ✅ FALLBACK: When you need derived types or lookup tables
const ERROR_CODES = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
// Result: 404 | 401 | 403

// ✅ FALLBACK: When you need template literal types
const CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
} as const;

type ChannelKey = keyof typeof CHANNELS;
type ChannelEvent = `on${Capitalize<ChannelKey>}`;
// Result: "onEMAIL" | "onSMS" | "onPUSH"
```

## Flat Interfaces (REQUIRED)

```typescript
// ✅ ALWAYS: One level depth, nested objects → dedicated interface
interface UserAddress {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: UserAddress;
}

interface Admin extends User {
  permissions: string[];
}

// ❌ NEVER: Inline nested objects
interface User {
  address: { street: string; city: string };
}
```

## Never Use `any`

```typescript
// ✅ Use unknown for truly unknown types
function parse(input: unknown): User {
  if (isUser(input)) return input;
  throw new Error('Invalid input');
}

// ✅ Use generics for flexible types
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// ❌ NEVER
function parse(input: any): any { }
```

## Utility Types

```typescript
Pick<User, 'id' | 'name'>     // Select fields
Omit<User, 'id'>              // Exclude fields
Partial<User>                 // All optional
Required<User>                // All required
Readonly<User>                // All readonly
Record<string, User>          // Object type
Extract<Union, 'a' | 'b'>     // Extract from union
Exclude<Union, 'a'>           // Exclude from union
NonNullable<T | null>         // Remove null/undefined
ReturnType<typeof fn>         // Function return type
Parameters<typeof fn>         // Function params tuple
```

## Type Guards

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

## Import Types

```typescript
import type { User } from './types';
import { createUser, type Config } from './utils';
```
