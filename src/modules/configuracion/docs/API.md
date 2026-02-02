# CONFIGURACIÓN Module - API Documentation

**Version**: 2.1.0  
**Module**: Gestión de Parámetros Operativos y Políticas del Sistema  
**Base Path**: `/api/configuracion`  
**Documentation**: [Swagger UI](http://localhost:3000/api/docs)

---

## Overview

The CONFIGURACIÓN (Configuration) module manages two core aspects of system operation:

1. **ParametroOperativo** - System operational parameters with type-safe validation
2. **Politica** - Versioned business policies with lifecycle management

This module uses **OpenAPI 3.0** documentation via Swagger/NestJS decorators.

---

## Architecture

```
HTTP Controllers (ConfiguracionController)
    ↓ @ValidateWith(Zod schemas)
Application Services (ConfiguracionApplicationService)
    ↓ Domain mapping
Domain Aggregates (ParametroOperativo, Politica)
    ↓ Pure business logic
Repositories (ConfiguracionPostgresRepository)
    ↓ Prisma ORM
PostgreSQL Database
```

---

## Core Concepts

### ParametroOperativo (Operational Parameter)

A **configurable parameter** that controls system behavior without code recompilation.

**Key Properties:**

- `clave` (string, UNIQUE): Business identifier (e.g., `DURACION_RESERVA_VENTA`)
- `tipoDato` (enum): Validation type - ENTERO, DECIMAL, BOOLEAN, TEXTO, DURACION
- `valor` (string): Current value (validated by tipoDato)
- `valorDefecto` (string): Reset value
- `valorMinimo`, `valorMaximo` (string, optional): Range constraints
- `requiereReinicio` (boolean): If true, app restart needed to apply

**Example Parameters:**

```
DURACION_RESERVA_VENTA       → 20 (minutos)
UMBRAL_STOCK_BAJO            → 10 (unidades)
SISTEMA_NOTIFICACIONES_ACTIVO → true (booleano)
```

### Politica (Policy)

A **versioned, lifecycle-managed** business policy (e.g., return policy, shipping policy).

**Lifecycle States:**

- `BORRADOR`: Under review, not yet active
- `VIGENTE`: Currently active and enforced system-wide
- **Only one VIGENTE policy per type** (enforced in application)
- `ARCHIVADA`: Obsolete, kept for audit trail

**Key Properties:**

- `tipo` (enum): CAMBIOS, ENVIOS, TERMINOS
- `version` (string): Semantic version (X.Y.Z)
- `contenido` (text): Full policy text
- `estado`: BORRADOR → VIGENTE → ARCHIVADA
- `fechaVigenciaDesde`, `fechaVigenciaHasta`: Validity dates

**Example Workflow:**

1. Create policy in BORRADOR state
2. Legal review
3. Publish to VIGENTE (previous VIGENTE auto-archived)
4. When replaced, archived to ARCHIVADA

---

## Endpoints

### Parameters API

#### 1. Create Parameter

**POST** `/configuracion/parametros`

Creates a new operational parameter.

**Request:**

```json
{
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "descripcion": "Tiempo en minutos que se reservan ítems en compra online",
  "tipoDato": "DURACION",
  "valor": "20",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false
}
```

**Validation:**

- `clave`: Unique, uppercase, underscores/digits only
- `tipoDato`: Must match enum (ENTERO|DECIMAL|BOOLEAN|TEXTO|DURACION)
- `valor`: Validated by tipoDato rules + range constraints
- `valorMinimo`, `valorMaximo`: Only for numeric types

**Response:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "clave": "DURACION_RESERVA_VENTA",
  "nombre": "Duración de Reserva para Ventas",
  "descripcion": "...",
  "tipoDato": "DURACION",
  "valor": "20",
  "valorDefecto": "20",
  "valorMinimo": "5",
  "valorMaximo": "60",
  "requiereReinicio": false,
  "modificadoPorId": null,
  "fechaModificacion": "2026-02-02T21:30:00.000Z"
}
```

**Errors:**

- `400 Bad Request`: Validation failed
- `409 Conflict`: Clave already exists

#### 2. Update Parameter Value

**PATCH** `/configuracion/parametros/:id`

Updates the value of an existing parameter (other fields immutable).

**Request:**

```json
{
  "valor": "25",
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Validation:**

- New `valor` validated by original `tipoDato` and range constraints
- Parameter must exist (404 if not found)

**Response:** `200 OK`

**Errors:**

- `400 Bad Request`: New value fails validation
- `404 Not Found`: Parameter not found

#### 3. Get Parameter by ID

**GET** `/configuracion/parametros/:id`

Retrieves parameter by UUID.

**Response:** `200 OK` - Parameter object
**Errors:**

- `404 Not Found`: Parameter not found

#### 4. Get Parameter by Clave (Natural Key) ⭐ Recommended

**GET** `/configuracion/parametros/clave/:clave`

Retrieves parameter by business identifier (more efficient than ID lookup).

**Example:**

```bash
GET /api/configuracion/parametros/clave/DURACION_RESERVA_VENTA
```

**Response:** `200 OK` - Parameter object
**Errors:**

- `404 Not Found`: Parameter not found

#### 5. List All Parameters

**GET** `/configuracion/parametros`

Returns all operational parameters without pagination.

**Response:** `200 OK` - Array of parameter objects

---

### Policies API

#### 1. Create Policy

**POST** `/configuracion/politicas`

Creates a new policy in **BORRADOR** state. Publish separately.

**Request:**

```json
{
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "# Política de Cambios v1.0.0\n\n## Elegibilidad\n- Producto sin usar\n- 30 días desde compra"
}
```

**Validation:**

- `tipo`: Must match enum (CAMBIOS|ENVIOS|TERMINOS)
- `version`: Semantic format (X.Y.Z)
- `(tipo, version)` tuple unique
- `contenido`: Not empty

**Response:** `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "...",
  "estado": "BORRADOR",
  "fechaVigenciaDesde": null,
  "fechaVigenciaHasta": null,
  "publicadoPorId": null,
  "fechaCreacion": "2026-02-02T22:00:00.000Z"
}
```

**Errors:**

- `400 Bad Request`: Validation failed
- `409 Conflict`: Tipo+version already exists

#### 2. Publish Policy (BORRADOR → VIGENTE)

**PATCH** `/configuracion/politicas/:id/publicar`

Transitions policy to **VIGENTE** state. Automatically archives previous VIGENTE policy of same type.

**Request:**

```json
{
  "fechaVigenciaDesde": "2026-02-15",
  "publicadoPorId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Behavior:**

- Policy transitions: BORRADOR → VIGENTE
- Previous VIGENTE policy (same type) → ARCHIVADA with fechaVigenciaHasta set
- Enforced application-wide

**Response:** `200 OK` - Updated policy in VIGENTE state

**Errors:**

- `404 Not Found`: Policy not found
- `400 Bad Request`: Invalid state or date

#### 3. Get Policy by ID

**GET** `/configuracion/politicas/:id`

Retrieves policy by UUID (any state).

**Response:** `200 OK` - Policy object
**Errors:**

- `404 Not Found`: Policy not found

#### 4. Get Active Policy by Type ⭐ Recommended

**GET** `/configuracion/politicas/vigente/:tipo`

Retrieves the currently **VIGENTE** policy of specified type.

**Example:**

```bash
GET /api/configuracion/politicas/vigente/CAMBIOS
```

**Response:** `200 OK` - Active policy object
**Errors:**

- `404 Not Found`: No active policy for this type

#### 5. List All Policies

**GET** `/configuracion/politicas`

Returns policies in all states (BORRADOR, VIGENTE, ARCHIVADA).

**Query Parameters:**

- `tipo` (optional): Filter by CAMBIOS|ENVIOS|TERMINOS

**Example:**

```bash
GET /api/configuracion/politicas?tipo=CAMBIOS
```

**Response:** `200 OK` - Array of policy objects

---

## Data Types & Validation

### TipoDato Enum

Parameter type determines validation rules:

| Type     | Example Value | Validation                       |
| -------- | ------------- | -------------------------------- |
| ENTERO   | "20"          | Valid integer                    |
| DECIMAL  | "0.25"        | Valid decimal (respects min/max) |
| BOOLEAN  | "true"        | "true" or "false"                |
| TEXTO    | "soporte@..." | Any string (up to 500 chars)     |
| DURACION | "20"          | Integer (usually minutes)        |

### Estado (Policy State)

```
BORRADOR  → Draft, under review
VIGENTE   → Active, enforced system-wide
ARCHIVADA → Obsolete, audit trail only
```

### TipoPolitica Enum

```
CAMBIOS   → Returns/exchanges policy
ENVIOS    → Shipping policy
TERMINOS  → Terms & conditions
```

---

## Common Patterns

### Pattern 1: Lookup Parameter by Business Key

```bash
# ✅ RECOMMENDED: Direct lookup by clave
GET /api/configuracion/parametros/clave/DURACION_RESERVA_VENTA

# ❌ AVOID: Two calls (list all, then filter)
GET /api/configuracion/parametros
```

### Pattern 2: Get Active Policy

```bash
# ✅ RECOMMENDED: Direct lookup of VIGENTE
GET /api/configuracion/politicas/vigente/CAMBIOS

# ❌ AVOID: List all, filter by estado + tipo
GET /api/configuracion/politicas?tipo=CAMBIOS
```

### Pattern 3: Update Parameter with Audit Trail

```bash
# Capture who modified the parameter
PATCH /api/configuracion/parametros/550e8400...
{
  "valor": "25",
  "modificadoPorId": "660e8400-e29b-41d4-a716-446655440001"
}
```

### Pattern 4: Policy Lifecycle

```bash
# Step 1: Create in BORRADOR
POST /api/configuracion/politicas
{
  "tipo": "CAMBIOS",
  "version": "1.0.0",
  "contenido": "..."
}
# → Returns id: 550e8400...

# Step 2: Legal review (offline)

# Step 3: Publish to VIGENTE
PATCH /api/configuracion/politicas/550e8400.../publicar
{
  "fechaVigenciaDesde": "2026-02-15",
  "publicadoPorId": "660e8400..."
}

# Step 4: Query active policy
GET /api/configuracion/politicas/vigente/CAMBIOS
# → Always returns VIGENTE version
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning                       |
| ---- | ----------------------------- |
| 201  | Resource created successfully |
| 200  | Request succeeded             |
| 400  | Validation error              |
| 404  | Resource not found            |
| 409  | Conflict (duplicate key)      |
| 500  | Server error                  |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Testing

### Unit Testing Structure

```
src/modules/configuracion/__tests__/
├── domain/
│   ├── parametro-operativo.entity.spec.ts
│   └── politica.entity.spec.ts
├── application/
│   ├── configuracion.service.spec.ts
│   └── configuracion.mapper.spec.ts
└── infrastructure/
    ├── configuracion.controller.spec.ts
    └── configuracion.repository.spec.ts
```

### Test Examples

```typescript
describe('ConfiguracionController', () => {
  describe('POST /configuracion/parametros', () => {
    it('should create parameter with valid input', () => {
      // Test: Create DURACION_RESERVA_VENTA
    });

    it('should reject duplicate clave', () => {
      // Test: 409 Conflict
    });

    it('should validate valor by tipoDato', () => {
      // Test: ENTERO must be integer
    });
  });

  describe('PATCH /configuracion/politicas/:id/publicar', () => {
    it('should archive previous VIGENTE on publish', () => {
      // Test: Auto-archive behavior
    });
  });
});
```

---

## Related Documentation

- [Module Domain Logic](./CONFIGURACION_CLAUDE.md)
- [Database Schema](./CONFIGURACION_ENTITIES_CLAUDE.md)
- [HTTP Examples](./examples/http-requests.md)
- [Request/Response Examples](./examples/)
- [Project Architecture](../../docs/arquitectura/)

---

## Version History

| Version | Date       | Changes                                                 |
| ------- | ---------- | ------------------------------------------------------- |
| 2.1.0   | 2026-02-02 | Initial CONFIGURACIÓN module with Parameters & Policies |
| 2.0.0   | 2025-12-XX | Previous version...                                     |

---

**Last Updated**: 2026-02-02  
**Maintainer**: Backend Team  
**Questions?** Check Swagger UI at `/api/docs`
