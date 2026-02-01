---
name: code-documenter
description: Document code with meaningful comments that explain WHY and SIDE EFFECTS, not WHAT. Use when adding, reviewing, or cleaning documentation in any programming language. Removes redundant comments that duplicate what the code already expresses. For JS/TS always uses JSDoc format. Produces verbose documentation only for agent files (CLAUDE.md, AGENTS.md) and README.md.
---

# Code Documenter

Document code with comments that provide real value: the reasoning behind decisions and non-obvious side effects.

## Core Philosophy

**Comment the WHY, never the WHAT.** Code is self-documenting for what it does; comments exist to explain what code cannot express: intent, trade-offs, and consequences.

## When to Comment

Add comments ONLY when:

1. **Explaining WHY** a decision was made (not what the code does)
2. **Documenting SIDE EFFECTS** that aren't obvious from the code
3. **Warning about NON-OBVIOUS BEHAVIOR** or edge cases
4. **Clarifying BUSINESS LOGIC** that requires domain knowledge

## When NOT to Comment

Never comment:

- Property/variable names that are self-descriptive
- Function names that describe their action
- Class names that indicate their purpose
- Obvious control flow (`// loop through items`)
- Type information already in signatures

## Comment Format by Language

### JavaScript / TypeScript

Always use JSDoc format (`/** */`):

```typescript
/**
 * Processes orders in batches to avoid memory issues with large datasets.
 * Emits 'batch-complete' event after each batch for progress tracking.
 * @throws {DatabaseError} When connection pool is exhausted
 */
async function processOrders(orders: Order[]): Promise<void>;
```

Bad (don't do this):

```typescript
/** This function processes orders */
async function processOrders(orders: Order[]): Promise<void>;

/** The user's name */
name: string;

/** Returns true if valid */
function isValid(): boolean;
```

### Other Languages

Use language-standard comment format. Same principles apply:

```python
def calculate_tax(amount: float, region: str) -> float:
    """
    Uses 2024 tax tables. Region codes follow ISO 3166-2.
    Falls back to federal rate if regional rate unavailable.
    """
```

```sql
-- Excludes soft-deleted records; index on deleted_at required for performance
SELECT * FROM orders WHERE deleted_at IS NULL;
```

```csharp
/// <summary>
/// Retries up to 3 times with exponential backoff.
/// Circuit breaker opens after 5 consecutive failures.
/// </summary>
public async Task<Response> CallExternalApi()
```

## Cleaning Existing Code

When cleaning documentation:

1. **Remove** comments that restate what code does
2. **Remove** comments on self-descriptive names
3. **Keep** comments explaining why or side effects
4. **Rewrite** vague comments to be specific about intent

Example cleanup:

```typescript
// Before
/** User service class */
class UserService {
  /** The user repository */
  private repo: UserRepository;

  /** Gets a user by ID */
  async getUser(id: string): Promise<User> {
    // Find the user
    return this.repo.findById(id);
  }
}

// After
class UserService {
  private repo: UserRepository;

  async getUser(id: string): Promise<User> {
    return this.repo.findById(id);
  }
}
```

Example with meaningful comments preserved:

```typescript
// Before (mixed quality)
/** Auth service */
class AuthService {
  /** JWT secret */
  private secret: string;

  /**
   * Validates token. Uses RS256 because our infrastructure
   * requires asymmetric keys for zero-trust architecture.
   */
  validateToken(token: string): boolean;
}

// After (only valuable comment kept)
class AuthService {
  private secret: string;

  /**
   * Uses RS256 because infrastructure requires asymmetric keys
   * for zero-trust architecture.
   */
  validateToken(token: string): boolean;
}
```

## Agent & README Files

For CLAUDE.md, AGENTS.md, and README.md files, use descriptive documentation:

- Explain what the project/agent does
- Document setup and usage
- Describe architecture decisions
- Include examples

These files are for human onboarding, not code execution.

## Quick Reference

| Scenario             | Comment? | Example                                             |
| -------------------- | -------- | --------------------------------------------------- |
| Why this algorithm?  | ✅ Yes   | `// O(1) lookup required for real-time constraints` |
| Side effect          | ✅ Yes   | `// Invalidates user session cache`                 |
| Non-obvious behavior | ✅ Yes   | `// Returns null for deleted users, not 404`        |
| What function does   | ❌ No    | ~~`// Gets user by ID`~~                            |
| Property name        | ❌ No    | ~~`// The user's email`~~                           |
| Obvious logic        | ❌ No    | ~~`// Check if null`~~                              |
