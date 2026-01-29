# Guía de Arquitectura Hexagonal para el Proyecto

## 🎯 Visión General

Este proyecto implementa **Arquitectura Hexagonal (Ports & Adapters)** combinada con **Domain-Driven Design (DDD)**. Este documento es la guía maestra para entender y trabajar con esta arquitectura.

## 📐 Estructura Global del Proyecto

```
store-backend/
├── src/
│   ├── shared/                      ← Código compartido entre módulos
│   │   ├── domain/
│   │   │   ├── value-objects/      ← UUID, Money, etc.
│   │   │   └── events/             ← Clase base EventoDominio
│   │   └── infrastructure/
│   │       └── persistence/        ← Configuración PrismaClient
│   │
│   └── modules/                     ← 11 Bounded Contexts
│       ├── identidad/
│       ├── catalogo/
│       ├── inventario/
│       ├── pre-venta/
│       ├── comercial/              ← Ejemplo completo implementado
│       ├── logistica/
│       ├── fiscal/
│       ├── comunicacion/
│       ├── configuracion/
│       ├── seguridad/
│       └── auditoria/
│
├── prisma/
│   └── schema.prisma               ← Esquema de base de datos
│
└── scripts/
    └── create-hexagonal-module.sh  ← Helper para crear módulos
```

## 🏗️ Estructura de un Módulo Hexagonal

Cada módulo sigue esta estructura exacta:

```
{modulo}/
├── domain/                          ← CAPA 1: NÚCLEO (sin dependencias)
│   ├── aggregates/                 ← Agregados DDD
│   │   ├── {agregado}/
│   │   │   ├── {agregado}.entity.ts
│   │   │   ├── {agregado}.types.ts  ← Props, Data (contratos internos)
│   │   │   └── types.ts            ← Enums compartidos
│   │
│   ├── value-objects/              ← Value Objects inmutables
│   │   └── {vo}.vo.ts
│   │
│   ├── ports/                      ← INTERFACES (contratos)
│   │   ├── inbound/               ← Casos de uso (QUÉ expone el módulo)
│   │   │   └── {servicio}.service.ts
│   │   │
│   │   └── outbound/              ← Dependencias (QUÉ necesita el módulo)
│   │       ├── {repositorio}.repository.ts
│   │       └── {modulo-externo}.port.ts
│   │
│   └── events/                     ← Eventos de dominio
│       └── {evento}.event.ts
│
├── application/                     ← CAPA 2: ORQUESTACIÓN
│   ├── services/                   ← Implementan puertos inbound
│   │   └── {servicio}.service.ts
│   │
│   ├── dto/                        ← Data Transfer Objects (API)
│   │   ├── {operacion}-request.dto.ts
│   │   └── {entidad}-response.dto.ts
│   │
│   └── mappers/                    ← Transformaciones Domain ↔ DTO
│       └── {entidad}.mapper.ts
│
├── infrastructure/                  ← CAPA 3: ADAPTADORES
│   ├── persistence/                ← Adaptadores de persistencia
│   │   ├── {repo}.repository.postgres.ts
│   │   └── mappers/
│   │       └── {entidad}.persistence.mapper.ts
│   │
│   ├── adapters/                   ← Adaptadores a otros módulos
│   │   └── {modulo}.adapter.ts
│   │
│   └── controllers/                ← Adaptadores HTTP (NestJS)
│       └── {controlador}.controller.ts
│
├── {modulo}.module.ts              ← Módulo NestJS (DI)
└── README.md                        ← Documentación del módulo
```

## 🔄 Flujo de Dependencias

### Regla de Oro: Las Dependencias Apuntan HACIA ADENTRO

```
┌─────────────────────────────────────────────┐
│         INFRASTRUCTURE                      │ ← Capa Externa
│  (Controllers, Adapters, Repositories)      │
│                                             │
│  Depende de ↓                               │
└──────────────┬──────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────┐
│         APPLICATION                          │ ← Capa Media
│       (Services, DTOs)                       │
│                                              │
│  Depende de ↓                                │
└──────────────┬───────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────┐
│           DOMAIN                             │ ← Capa Interna (NÚCLEO)
│  (Aggregates, Value Objects, Ports, Events)  │
│                                              │
│  NO DEPENDE DE NADA ✅                       │
└──────────────────────────────────────────────┘
```

### Reglas Estrictas

```
✅ PERMITIDO:
  domain/        → [NADA]
  application/   → domain/
  infrastructure → domain/ + application/

❌ PROHIBIDO:
  domain/        → application/  ❌ NUNCA
  domain/        → infrastructure/ ❌ NUNCA
  application/   → infrastructure/ ❌ NUNCA
```

## 🎨 Inversión de Dependencias con Puertos

### El Problema que Resuelve

**SIN Hexagonal (dependencia directa):**

```typescript
// ❌ MAL: Dominio depende de infraestructura
class VentaService {
  constructor(private prisma: PrismaClient) {} // Acoplamiento directo

  async crear() {
    await this.prisma.venta.create({ ... }); // Dominio conoce Prisma
  }
}
```

**CON Hexagonal (inversión de dependencias):**

```typescript
// ✅ BIEN: Dominio define interfaz (puerto)
// domain/ports/outbound/venta.repository.ts
export interface VentaRepository {
  save(venta: Venta): Promise<void>;
}

// application/services/venta-application.service.ts
class VentaApplicationService {
  constructor(private repo: VentaRepository) {} // Depende de interfaz

  async crear() {
    await this.repo.save(venta); // No conoce la implementación
  }
}

// infrastructure/persistence/venta-postgres.repository.ts
class VentaPostgresRepository implements VentaRepository {
  constructor(private prisma: PrismaClient) {}

  async save(venta: Venta) {
    // Implementación con Prisma
  }
}
```

### Puertos Inbound vs Outbound

```
                    ┌─────────────────┐
                    │   Controller    │ (Adaptador Primario)
                    └────────┬────────┘
                             │ usa
                             ↓
                     ┌─────────────────┐
   INBOUND ─────────│  VentaService   │ (Puerto de Entrada)
                     └────────┬────────┘
                              │ implementa
                              ↓
                     ┌───────────────────────────┐
                     │  VentaApplicationService  │ (Application Service)
                     └────────┬──────────────────┘
                              │ usa
                              ↓
             ┌────────────────────────────────┐
             │                                │
             ↓                                ↓
   ┌─────────────────┐          ┌─────────────────────┐
   │VentaRepository  │          │  InventarioPort     │ (Puertos de Salida)
   └────────┬────────┘          └──────────┬──────────┘
            │ implementa                   │ implementa
            ↓                              ↓
   ┌───────────────────────┐  ┌─────────────────────┐
OUTBOUND │VentaPostgresRepository│  │ InventarioHttpAdapter│ (Adaptadores Secundarios)
   └───────────────────────┘  └─────────────────────┘
```

## 📦 Agregados DDD y Repositorios

### Principio Fundamental: Un Agregado = Un Repository

**REGLA CRÍTICA**: Cada agregado tiene EXACTAMENTE un repository. Las entidades internas del agregado NO tienen repositories propios.

```typescript
// ✅ CORRECTO: Un repository por agregado
export interface InventarioRepository {
  guardar(inventario: Inventario, options?: GuardarOptions): Promise<void>;
  buscarPorId(id: string): Promise<Inventario | null>;

  // Queries de entidades internas (solo lectura)
  buscarReservasActivas(operacionId: string): Promise<Reserva[]>;
  buscarMovimientos(inventarioId: string): Promise<MovimientoInventario[]>;
}

// ❌ INCORRECTO: Repositories separados para entidades internas
export interface ReservaRepository { ... }  // ❌ Viola DDD
export interface MovimientoRepository { ... }  // ❌ Viola DDD
```

### ¿Por qué es un error tener múltiples repositories?

Cuando permitís que las entidades internas se persistan independientemente:

1. ❌ **Pierdes control transaccional** - No hay atomicidad garantizada
2. ❌ **Rompes invariantes** - Podés reservar más de lo disponible
3. ❌ **Pierdes el "root"** - El aggregate root deja de ser punto de entrada
4. ❌ **Rompes trazabilidad** - Los movimientos pueden quedar huérfanos

### API Declarativa para Entidades Internas

En vez de callbacks, usamos **opciones declarativas** que especifican qué entidades internas persistir:

```typescript
// ✅ BIEN: API Declarativa
export interface GuardarInventarioOptions {
  reservas?: {
    nuevas?: Reserva[]; // Reservas recién creadas por el agregado
    actualizadas?: Reserva[]; // Reservas existentes modificadas
  };
  movimientos?: MovimientoInventario[]; // Siempre nuevos (append-only)
}

// Uso claro y expresivo
const reserva = inventario.reservar(props);
await repo.guardar(inventario, {
  reservas: { nuevas: [reserva] }, // Intención clara: es una CREACIÓN
});

// ❌ MAL: Callbacks (patrón viejo)
await repo.guardarConTransaction(inventario, async () => {
  await repo.guardarReserva(reserva); // Menos expresivo, más complejo
});
```

**Ventajas de la API declarativa**:

- ✅ Más expresiva (defines QUÉ persistir, no CÓMO)
- ✅ Type-safe (el compilador valida la estructura)
- ✅ Más testeable (sin callbacks que mockear)
- ✅ Más legible (menos nesting)

### Ejemplo Real: Agregado Inventario

El agregado `Inventario` tiene entidades internas `Reserva` y `MovimientoInventario`:

```typescript
// domain/aggregates/inventario/inventario.entity.ts
export class Inventario {
  // Métodos que CREAN entidades internas
  reservar(props): Reserva {
    // Valida invariantes (stock disponible, etc.)
    const reserva = ReservaFactory.crear(...);
    this.cantidadReservada += reserva.cantidad;
    return reserva;  // El agregado la creó
  }

  consolidarReserva(reserva: Reserva): MovimientoInventario {
    // Valida invariantes y crea movimiento
    const movimiento = MovimientoInventarioFactory.crear(...);
    return movimiento;
  }
}

// application/services/inventario.service.ts
async reservarInventario(request) {
  const inventario = await this.repo.buscarPorItem(...);

  // El agregado crea la reserva (valida invariantes)
  const reserva = inventario.reservar(props);

  // Persistimos TODO junto (atómico)
  await this.repo.guardar(inventario, {
    reservas: { nuevas: [reserva] }
  });
}

async consolidarReserva(request) {
  // Cargamos reserva existente de BD
  const reservas = await this.repo.buscarReservasActivas(operacionId);

  for (const reserva of reservas) {
    const inventario = await this.repo.buscarPorId(reserva.inventarioId);

    // Modificamos reserva existente
    reserva.consolidar();
    const movimiento = inventario.consolidarReserva(reserva);

    // Persistimos TODO junto (atómico)
    await this.repo.guardar(inventario, {
      reservas: { actualizadas: [reserva] },
      movimientos: [movimiento]
    });
  }
}
```

### Implementación del Repository (Prisma)

```typescript
// infrastructure/persistence/inventario-postgres.repository.ts
export class InventarioPostgresRepository implements InventarioRepository {
  async guardar(
    inventario: Inventario,
    options?: GuardarInventarioOptions
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Guardar aggregate root (con optimistic locking)
      const versionAnterior = inventario.version - 1;
      const resultado = await tx.inventario.updateMany({
        where: { id: inventario.id, version: versionAnterior },
        data: { ...inventarioData }
      });

      if (resultado.count === 0) {
        throw new OptimisticLockingError('Inventario', inventario.id);
      }

      // 2. Persistir entidades internas (si se especificaron)
      if (options?.reservas?.nuevas) {
        for (const reserva of options.reservas.nuevas) {
          await tx.reserva.create({ data: { ...reservaData } });
        }
      }

      if (options?.reservas?.actualizadas) {
        for (const reserva of options.reservas.actualizadas) {
          await tx.reserva.update({
            where: { id: reserva.id },
            data: { estado: reserva.estado, ... }
          });
        }
      }

      if (options?.movimientos) {
        for (const mov of options.movimientos) {
          await tx.movimientoInventario.create({ data: { ...movData } });
        }
      }
    });
  }

  // Queries de lectura (sin restricciones)
  async buscarReservasActivas(operacionId: string): Promise<Reserva[]> {
    const datos = await this.prisma.reserva.findMany({
      where: { operacionId, estado: 'ACTIVA' }
    });
    return datos.map(d => Reserva.desde(d));
  }
}
```

### Definición de Agregado

Un agregado es un cluster de objetos de dominio (entidad raíz + entidades hijas + value objects) que se tratan como una unidad para cambios de datos.

### Ejemplo: Agregado Venta

```typescript
// domain/aggregates/venta.aggregate.ts
export class Venta {
  // Estado privado
  private props: VentaProps;
  private lineas: LineaVenta[] = [];
  private eventos: EventoDominio[] = [];

  // Constructor privado (Factory Methods públicos)
  private constructor(props: VentaProps) { ... }

  // Factory Method
  static crear(params): Venta {
    // Validar INVARIANTES
    if (params.lineas.length === 0) {
      throw new Error('Debe tener al menos una línea');
    }

    const venta = new Venta({ ... });

    // Emitir evento de dominio
    venta.eventos.push(new VentaCreada(venta.id));

    return venta;
  }

  // Métodos de negocio (NO setters tontos)
  confirmar(): void {
    // Validar precondiciones
    if (this.estado !== EstadoVenta.BORRADOR) {
      throw new Error('Solo se pueden confirmar ventas en borrador');
    }

    // Aplicar cambio
    this.estado = EstadoVenta.CONFIRMADA;
    this.fechaConfirmacion = new Date();

    // Emitir evento
    this.eventos.push(new VentaConfirmada(this.id));
  }

  // Getters (NO exponer estado mutable)
  getId(): UUID {
    return this.props.id;
  }

  getEventos(): EventoDominio[] {
    return [...this.eventos]; // Copia defensiva
  }
}
```

### Invariantes del Agregado

Los agregados **GARANTIZAN** sus invariantes (reglas de negocio):

```typescript
// ✅ BIEN: Invariante protegida por el agregado
class Venta {
  confirmar() {
    if (this.estado !== EstadoVenta.BORRADOR) {
      throw new Error('...');
    }
    // ... cambio de estado
  }
}

// ❌ MAL: Invariante no protegida
class Venta {
  estado: EstadoVenta; // público, cualquiera puede cambiar
}

// Desde afuera:
venta.estado = EstadoVenta.CONFIRMADA; // ❌ Saltea lógica de negocio
```

## 🏷️ Convenciones de Nombres (Puertos y Adaptadores)

### NO Usar Prefijo "I" en Interfaces

A diferencia de lenguajes como C# o Java, en TypeScript/JavaScript **NO usamos prefijo "I"** para interfaces.

```typescript
// ❌ MAL: Prefijo "I" (convención antigua de C#/Java)
export interface IVentaRepository { ... }
export interface IVentaService { ... }
export interface IInventarioPort { ... }

// ✅ BIEN: Nombres descriptivos sin prefijo
export interface VentaRepository { ... }
export interface VentaService { ... }
export interface InventarioPort { ... }
```

**Razón**: Las interfaces representan contratos de dominio, no son "tipos técnicos". El nombre debe describir el concepto, no el mecanismo de implementación.

### Sufijos para Adaptadores (Implementaciones)

Los adaptadores (implementaciones concretas) usan sufijos técnicos que indican la tecnología o protocolo:

```typescript
// Puerto (interfaz de dominio)
export interface InventarioRepository {
  guardar(inventario: Inventario): Promise<void>;
}

// Adaptadores (implementaciones concretas)
export class InventarioPostgresRepository implements InventarioRepository { ... }
export class InventarioMongoRepository implements InventarioRepository { ... }
export class InventarioInMemoryRepository implements InventarioRepository { ... }

// Otro ejemplo: Puertos de comunicación entre módulos
export interface InventarioPort {
  verificarDisponibilidad(props): Promise<boolean>;
}

export class InventarioHttpAdapter implements InventarioPort { ... }
export class InventarioEventAdapter implements InventarioPort { ... }
export class InventarioGrpcAdapter implements InventarioPort { ... }
```

### Application Services

Los servicios de aplicación añaden sufijo `ApplicationService` para diferenciar de la interfaz:

```typescript
// Puerto inbound (interfaz)
export interface VentaService {
  crearDesdeCarrito(carritoId: string): Promise<VentaResponseDto>;
}

// Implementación
export class VentaApplicationService implements VentaService { ... }
```

### Resumen de Convenciones

| Tipo                     | Convención                                | Ejemplo                             |
| ------------------------ | ----------------------------------------- | ----------------------------------- |
| **Puerto Inbound**       | `{Concepto}Service`                       | `VentaService`                      |
| **Puerto Outbound**      | `{Concepto}Repository` o `{Concepto}Port` | `VentaRepository`, `InventarioPort` |
| **Adaptador Repository** | `{Concepto}{Tecnología}Repository`        | `VentaPostgresRepository`           |
| **Adaptador Port**       | `{Concepto}{Protocolo}Adapter`            | `InventarioHttpAdapter`             |
| **Application Service**  | `{Concepto}ApplicationService`            | `VentaApplicationService`           |
| **Agregado**             | `{Concepto}`                              | `Venta`, `Inventario`               |
| **Value Object**         | `{Concepto}`                              | `Money`, `UUID`, `Email`            |

## 📝 Documentación de Código

### Principio: Documentar el WHY, No el WHAT

Seguimos la filosofía de que **el código es auto-documentario para el WHAT**. Los comentarios existen para explicar lo que el código no puede expresar:

1. **WHY** se tomó una decisión de diseño
2. **SIDE EFFECTS** no obvios
3. **NON-OBVIOUS BEHAVIOR** o edge cases
4. **BUSINESS LOGIC** que requiere contexto del dominio

### Formato JSDoc para TypeScript

```typescript
/**
 * Uses version-based optimistic locking to prevent lost updates
 * when multiple processes modify the same inventory simultaneously.
 *
 * All operations execute atomically within a single transaction;
 * if any fails, everything rolls back to prevent partial state.
 *
 * @throws {OptimisticLockingError} When version mismatch detected
 */
async guardar(
  inventario: Inventario,
  options?: GuardarInventarioOptions
): Promise<void>;
```

### Qué NO Documentar

```typescript
// ❌ MAL: Documenta el WHAT (obvio por el nombre)
/**
 * Gets a user by ID
 */
getUser(id: string): Promise<User>

/**
 * The user's email
 */
email: string;

/**
 * Saves the inventory
 */
guardar(inventario: Inventario): Promise<void>;

// ✅ BIEN: Sin comentario (auto-descriptivo)
getUser(id: string): Promise<User>
email: string;
guardar(inventario: Inventario): Promise<void>;
```

### Qué SÍ Documentar

```typescript
// ✅ BIEN: Documenta el WHY técnico
/**
 * Queries only ACTIVA state to avoid re-processing reservations
 * already handled by previous job executions.
 */
buscarReservasExpiradas(): Promise<Reserva[]>;

// ✅ BIEN: Documenta decisión de diseño
/**
 * Enforces DDD principle: one aggregate = one repository.
 * Internal entities must NOT be persisted outside this repository.
 */
export interface InventarioRepository { ... }

// ✅ BIEN: Documenta side effect crítico
/**
 * Uses MD5 because legacy clients expect it.
 * TODO: Migrate to SHA-256 after v2.0.
 */
hashPassword(password: string): string
```

### Limpieza de Comentarios Redundantes

Cuando revises código, **elimina comentarios que se pueden borrar sin perder claridad**:

```typescript
// ANTES (redundante)
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

// DESPUÉS (limpio)
class UserService {
  private repo: UserRepository;

  async getUser(id: string): Promise<User> {
    return this.repo.findById(id);
  }
}
```

### Regla de Oro

> **Si lo puedo borrar y el código sigue siendo claro → BORRARLO**

## ✨ Validación con Decoradores Personalizados

### Problema: Repetición de Pipes en Controllers

Cuando se validan múltiples operaciones en un controller, el patrón inline con `new ZodValidationPipe()` causa repetición:

```typescript
// ❌ REPETITIVO: Pipes instantiados en cada parámetro
@Controller('inventario')
export class InventarioController {
  @Post('reservar')
  async reservarInventario(
    @Body(new ZodValidationPipe(ReservarInventarioSchema))
    dto: ReservarInventarioDto,
  ) {}

  @Post('consolidar')
  async consolidarReserva(
    @Body(new ZodValidationPipe(ConsolidarReservaSchema))
    dto: ConsolidarReservaDto,
  ) {}

  @Post('ajustar')
  async ajustarInventario(
    @Body(new ZodValidationPipe(AjustarInventarioSchema))
    dto: AjustarInventarioDto,
  ) {}
}
```

**Problemas:**

- Verbose y difícil de leer
- Esquema acoplado al decorador de parámetro
- Difícil de reutilizar entre controllers

### Solución: Decorador Composable `@ValidateWith()`

Crear un decorador custom que combine `@UsePipes()` internamente:

````typescript
// shared/decorators/validate-with.decorator.ts
import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * Applies Zod schema validation to a handler using a composable decorator.
 * Combines with @UsePipes internally to keep handler signatures clean.
 *
 * Side effects:
 * - Pipes are applied in order: earlier decorators execute first
 * - Validation errors throw BadRequestException with formatted Zod issues
 * - Type coercion follows Zod's strict mode rules
 *
 * @param schema - Zod schema for validating request body/query/params
 *
 * @example
 * ```typescript
 * @Post('reservar')
 * @ValidateWith(ReservarInventarioSchema)
 * async reservarInventario(@Body() dto: ReservarInventarioDto) { }
 * ```
 */
export function ValidateWith(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}
````

### Uso en Controllers

```typescript
// ✅ LIMPIO: Decorador específico, firma clara
@Controller('inventario')
export class InventarioController {
  @Post('reservar')
  @ValidateWith(ReservarInventarioSchema)
  async reservarInventario(@Body() dto: ReservarInventarioDto) {}

  @Patch('consolidar')
  @ValidateWith(ConsolidarReservaSchema)
  async consolidarReserva(@Body() dto: ConsolidarReservaDto) {}

  @Patch('ajustar')
  @ValidateWith(AjustarInventarioSchema)
  async ajustarInventario(@Body() dto: AjustarInventarioDto) {}

  @Get('disponibilidad')
  @ValidateWith(ConsultarDisponibilidadSchema)
  async consultarDisponibilidad(@Query() query: ConsultarDisponibilidadDto) {}
}
```

### Ventajas del Decorador Composable

| Aspecto            | Inline Pipe   | @ValidateWith |
| ------------------ | ------------- | ------------- |
| **Legibilidad**    | ❌ Verbose    | ✅ Limpio     |
| **Reutilización**  | ❌ No         | ✅ Sí         |
| **Type-safety**    | ✅ Sí         | ✅ Sí         |
| **Composición**    | ❌ Limitada   | ✅ Full       |
| **Mantenibilidad** | ❌ Repetitivo | ✅ DRY        |

### Composición con Otros Decoradores

El decorador `@ValidateWith()` se compone con otros decoradores sin conflictos:

```typescript
@Post('crear')
@ValidateWith(CrearInventarioSchema)
@RequireRole('ADMIN')      // Otro decorador personalizado
@RateLimit(100)            // Otro decorador personalizado
async crearInventario(
  @Body() dto: CrearInventarioDto,
  @CurrentUser() user: User,
) { }
```

**Orden de aplicación (de arriba a abajo):**

1. `@Post('crear')` - Definir ruta
2. `@ValidateWith()` - Validar entrada
3. `@RequireRole()` - Autorización
4. `@RateLimit()` - Control de acceso

---

## 🔌 Inyección de Dependencias con NestJS

### Configuración del Módulo

```typescript
// {modulo}.module.ts
import {
  VENTA_SERVICE_TOKEN,
  VENTA_REPOSITORY_TOKEN,
} from './domain/ports/tokens';

@Module({
  controllers: [VentaController],
  providers: [
    // Puertos Inbound → Implementaciones
    {
      provide: VENTA_SERVICE_TOKEN,
      useClass: VentaApplicationService,
    },

    // Puertos Outbound → Implementaciones
    {
      provide: VENTA_REPOSITORY_TOKEN,
      useClass: VentaPostgresRepository,
    },
    {
      provide: INVENTARIO_PORT_TOKEN,
      useClass: InventarioHttpAdapter, // ← Cambiable
    },
    {
      provide: CATALOGO_PORT_TOKEN,
      useClass: CatalogoHttpAdapter,
    },
  ],
  exports: [VENTA_SERVICE_TOKEN], // Exportar para otros módulos
})
export class ComercialModule {}
```

**Nota**: Usamos Symbols como tokens en vez de strings para type-safety:

```typescript
// domain/ports/tokens.ts
export const VENTA_SERVICE_TOKEN = Symbol('VENTA_SERVICE');
export const VENTA_REPOSITORY_TOKEN = Symbol('VENTA_REPOSITORY');
export const INVENTARIO_PORT_TOKEN = Symbol('INVENTARIO_PORT');
```

### Cambiar Implementación SIN Tocar Dominio

```typescript
// Hoy: Comunicación HTTP
{
  provide: INVENTARIO_PORT_TOKEN,
  useClass: InventarioHttpAdapter,
}

// Mañana: Comunicación por Eventos
{
  provide: INVENTARIO_PORT_TOKEN,
  useClass: InventarioEventAdapter, // ← Solo cambiamos esto
}

// El dominio y application NO cambian ✅
```

## 📊 Types (Domain) vs DTOs (Application)

### Types del Dominio

**Ubicación**: `domain/aggregates/{entidad}/{entidad}.types.ts`

Interfaces que definen contratos de **métodos del dominio**:

```typescript
// domain/aggregates/inventario/inventario.types.ts
export interface ReservarInventarioProps {
  readonly cantidad: number;
  readonly tipoOperacion: TipoOperacionEnum; // ← Enum del dominio
  readonly actorTipo: TipoActorEnum;
}

export interface InventarioData {
  readonly id: string;
  readonly cantidadDisponible: number;
  // ... datos para reconstruir desde BD
}

// Usado en:
class Inventario {
  reservar(props: ReservarInventarioProps): Reserva {}
  static desde(data: InventarioData): Inventario {}
}
```

**Características**:

- Tipos estrictos del dominio (enums, value objects)
- Solo se usan DENTRO del dominio
- Props para factory methods y comandos
- Data para reconstrucción desde persistencia

### DTOs de Aplicación

**Ubicación**: `application/dto/{operacion}.dto.ts`

Contratos de **entrada/salida de la API**:

```typescript
// application/dto/reservar-inventario-request.dto.ts
export class ReservarInventarioRequestDto {
  tipoItem: string; // ← String primitivo (HTTP)
  cantidad: number;
  tipoOperacion: string; // ← String, NO enum
  actorTipo: string;
}

// application/dto/inventario-response.dto.ts
export class InventarioResponseDto {
  id: string;
  cantidadDisponible: number;
  fechaActualizacion: string; // ← String ISO (JSON)
}
```

**Características**:

- Tipos primitivos (string, number, boolean)
- Usados en controllers, GraphQL resolvers
- Se mapean a Types del dominio en application services
- Validación con class-validator

### Flujo de Transformación

```
HTTP Request (JSON)
    ↓
ReservarInventarioRequestDto (primitivos)
    ↓ [Mapper en Application Service]
ReservarInventarioProps (tipos de dominio)
    ↓
Inventario.reservar(props)
```

## 📝 Mappers: Separación de Modelos

### Mapper de Persistencia (Domain ↔ Prisma)

```typescript
// infrastructure/persistence/mappers/venta-persistence.mapper.ts
export class VentaPersistenceMapper {
  // Domain → Prisma
  static toPrisma(venta: Venta): PrismaVentaCreateInput {
    return {
      id: venta.getId().toString(),
      cliente_id: venta.getClienteId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      // ... todos los campos
    };
  }

  // Prisma → Domain
  static toDomain(prismaVenta: PrismaVenta): Venta {
    // Reconstruir agregado desde datos de BD
    // IMPORTANTE: No llamar a factory methods (ya está creado)
    return Venta.reconstruct({
      id: UUID.fromString(prismaVenta.id),
      // ... todos los campos
    });
  }
}
```

### Mapper de DTO (Domain ↔ API)

```typescript
// application/mappers/venta.mapper.ts
export class VentaMapper {
  static toDto(venta: Venta): VentaDto {
    return {
      id: venta.getId().toString(),
      estado: venta.getEstado(),
      total: venta.getTotal().getAmount(),
      moneda: venta.getTotal().getCurrency(),
    };
  }
}
```

## 🧪 Testing en Hexagonal

### Unit Tests (Dominio - SIN Mocks)

```typescript
describe('Venta Aggregate', () => {
  it('debe crear venta válida', () => {
    const venta = Venta.crear({
      lineas: [lineaValida],
      // ...
    });

    expect(venta.getEstado()).toBe(EstadoVenta.BORRADOR);
    expect(venta.getLineas()).toHaveLength(1);
  });

  it('debe fallar si no hay líneas', () => {
    expect(() => {
      Venta.crear({ lineas: [] });
    }).toThrow('Debe tener al menos una línea');
  });
});
```

**NO se usan mocks** - El dominio es puro.

### Integration Tests (Application - CON Mocks de Puertos)

```typescript
describe('VentaApplicationService', () => {
  let service: VentaApplicationService;
  let mockRepo: jest.Mocked<VentaRepository>;
  let mockInventario: jest.Mocked<InventarioPort>;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockInventario = {
      verificarDisponibilidad: jest.fn().mockResolvedValue(true),
      reservar: jest.fn().mockResolvedValue(UUID.create()),
    } as any;

    service = new VentaApplicationService(mockRepo, mockInventario, ...);
  });

  it('debe crear venta desde carrito', async () => {
    await service.crearDesdeCarrito(carritoId, clienteId);

    expect(mockInventario.reservar).toHaveBeenCalled();
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

**Mockeamos PUERTOS (interfaces)**, no implementaciones concretas.

### E2E Tests (Infraestructura - Base de Datos Real)

```typescript
describe('Venta E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ComercialModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('POST /ventas debe crear venta', async () => {
    const response = await request(app.getHttpServer())
      .post('/ventas')
      .send({ carritoId: '...', clienteId: '...' })
      .expect(201);

    expect(response.body.ventaId).toBeDefined();
  });
});
```

## 🚀 Flujo Completo de una Operación

**Ejemplo: Crear Venta desde Carrito**

1. **HTTP Request** → `POST /ventas`

2. **VentaController** (adaptador primario)

   ```typescript
   @Post()
   async crear(@Body() dto: CrearVentaDto) {
     return this.ventaService.crearDesdeCarrito(...);
   }
   ```

3. **VentaService** (application service)

   ```typescript
   async crearDesdeCarrito(carritoId, clienteId) {
     // Verificar disponibilidad (puerto outbound)
     const disponible = await this.inventarioPort.verificar(...);

     // Obtener precios (puerto outbound)
     const precios = await this.catalogoPort.obtenerPrecios(...);

     // Crear agregado (dominio puro)
     const venta = Venta.crear({ ... });

     // Persistir (puerto outbound)
     await this.ventaRepo.save(venta);

     // Publicar eventos (puerto outbound)
     await this.eventBus.publish(venta.getEventos());
   }
   ```

4. **Adaptadores** (implementaciones)
   - `InventarioAdapter` → Llama a módulo INVENTARIO
   - `CatalogoAdapter` → Llama a módulo CATALOGO
   - `PrismaVentaRepository` → Guarda en BD
   - `EventBusAdapter` → Publica a Redis/RabbitMQ

5. **HTTP Response** → 201 Created con datos de la venta

## 📋 Checklist para Crear un Módulo

- [ ] Leer `{MODULO}_CLAUDE.md` (lógica de negocio)
- [ ] Leer `{MODULO}_ENTITIES_CLAUDE.md` (entidades)
- [ ] Ejecutar `./scripts/create-hexagonal-module.sh {modulo}`

**DOMAIN:**

- [ ] Crear agregados en `domain/aggregates/`
- [ ] Crear value objects en `domain/value-objects/`
- [ ] Definir puertos inbound en `domain/ports/inbound/`
- [ ] Definir puertos outbound en `domain/ports/outbound/`
- [ ] Crear eventos en `domain/events/`

**APPLICATION:**

- [ ] Implementar servicios en `application/services/`
- [ ] Crear DTOs en `application/dto/`
- [ ] Crear mappers en `application/mappers/`

**INFRASTRUCTURE:**

- [ ] Implementar repositorios en `infrastructure/persistence/`
- [ ] Crear mappers de persistencia
- [ ] Implementar adaptadores a otros módulos
- [ ] Crear controllers HTTP

**NESTJS:**

- [ ] Configurar módulo con DI
- [ ] Escribir tests unitarios (dominio)
- [ ] Escribir tests de integración (application)
- [ ] Escribir tests E2E

## 🎓 Principios Clave a Recordar

1. **El dominio es PURO** - Sin dependencias externas
2. **Puertos = Contratos** - Interfaces, no implementaciones
3. **Agregados protegen invariantes** - Lógica de negocio en el dominio
4. **Inyección por interfaces** - Cambiar implementaciones fácilmente
5. **Eventos de dominio** - Comunicación desacoplada entre módulos
6. **Mappers bidireccionales** - Separación modelo dominio/persistencia
7. **Tests sin mocks en dominio** - Lógica pura
8. **Tests con mocks de puertos** - Orquestación aislada

## 📚 Referencias

- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Implementing DDD - Vaughn Vernon](https://vaughnvernon.com/)
