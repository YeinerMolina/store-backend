# Arquitectura de Tienda Online API

## 📐 Principios Arquitectónicos

Esta API está diseñada con:

- **Clean Architecture**: Separación clara de responsabilidades
- **Domain-Driven Design (DDD)**: El negocio está en el centro, no la tecnología
- **Hexagonal Architecture (Ports & Adapters)**: Desacoplamiento de externos
- **Event-Driven**: Comunicación asíncrona entre módulos
- **SOLID Principles**: Especialmente Dependency Inversion

## 🏗️ Estructura de Carpetas

```
src/
├── shared/                          # Código reutilizable (no negocio específico)
│   ├── domain/
│   │   ├── entity.ts               # Entity y AggregateRoot base
│   │   ├── value-object.ts         # ValueObject base
│   │   └── exceptions/
│   │       └── domain.exception.ts # Excepciones de negocio
│   │
│   ├── application/
│   │   ├── base.dto.ts             # DTO base
│   │   └── mapper.ts               # Mapper genérico
│   │
│   ├── ports/
│   │   ├── repository.port.ts      # IRepository (contrato)
│   │   └── event-publisher.port.ts # IEventPublisher (contrato)
│   │
│   └── adapters/
│       └── event-emitter.adapter.ts # Implementación de IEventPublisher
│
├── modules/                         # Cada módulo es independiente
│   ├── inventory/
│   │   ├── domain/
│   │   │   ├── inventory-item.entity.ts  # Agregado + Value Objects
│   │   │   └── inventory.repository.ts   # IInventoryRepository (específico)
│   │   │
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   └── adjust-inventory.service.ts  # Use case/orquestación
│   │   │   └── mappers/
│   │   │       └── inventory-item.mapper.ts     # Domain ↔ DTO
│   │   │
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── inventory-item.schema.ts     # Tabla TypeORM
│   │   │       └── inventory-item.repository.ts # Implementación del port
│   │   │
│   │   ├── presentation/
│   │   │   ├── dtos/
│   │   │   │   └── inventory-item.dto.ts
│   │   │   └── inventory.controller.ts          # HTTP endpoints
│   │   │
│   │   └── inventory.module.ts                   # Módulo NestJS
│   │
│   ├── orders/
│   ├── customers/
│   ├── payments/
│   ├── suppliers/
│   ├── shipments/
│   └── invoices/
│
└── app.module.ts                   # Orquestador principal
```

## 🔄 Flujo de Datos

```
HTTP Request
    ↓
Controller (presentation)
    ↓
Application Service (orquestación)
    ↓
Domain Model (lógica de negocio pura)
    ↓
Repository Port (infraestructura)
    ↓
Database (persistencia)
    ↓
Domain Events (publicación)
    ↓
Event Subscribers (otros módulos escuchan)
```

## 📦 Por Capas

### 1. **Domain Layer** (Pura lógica de negocio)

- Contiene **Entities**, **Aggregates**, **Value Objects**
- NO depende de frameworks
- NO tiene dependencias externas
- Completamente testeable

**Ejemplo: Inventario**

- `InventoryItem` (AggregateRoot)
- `SKU`, `Quantity` (Value Objects)
- Métodos como `reserveStock()`, `adjustQuantity()`
- Publica eventos: `StockReservedEvent`, `InventoryQuantityAdjustedEvent`

### 2. **Application Layer** (Orquestación)

- **Services**: Coordinan dominio + infraestructura
- **Mappers**: Convierten Domain ↔ DTO
- **DTOs**: Objetos para HTTP (respuestas)

**Ejemplo: AdjustInventoryService**

```
1. Obtiene el agregado del repositorio
2. Modifica el agregado (lógica de negocio)
3. Guarda cambios
4. Publica eventos
5. Limpia eventos
```

### 3. **Infrastructure Layer** (Detalles técnicos)

- **Repositories**: Implementan el contrato (Port)
- **Schemas**: Mapeos a base de datos
- **Adapters**: Integraciones externas (Email, Pagos, etc)

**Porqué es importante**:

- Puedes cambiar de TypeORM a Prisma sin tocar dominio
- Puedes cambiar de PostgreSQL a MongoDB sin afectar lógica
- Testeable: injección de dependencias en test

### 4. **Presentation Layer** (HTTP)

- **Controllers**: Reciben requests, llaman a services, retornan DTOs
- **DTOs**: Esquemas para request/response
- NUNCA expongas directamente los agregados

## 🎯 Principios Clave

### ✅ Dependency Injection (DI)

Nunca hardcodees dependencias. NestJS lo maneja vía `@Module()`:

```typescript
@Module({
  providers: [
    AdjustInventoryService,
    {
      provide: IInventoryRepository,
      useClass: TypeOrmInventoryRepository,  // ← En test: MockRepository
    },
  ],
})
```

### ✅ Ports & Adapters

```
Port (Interfaz):     interface IRepository { save(...) }
Adapter (Impl):      class TypeOrmRepository implements IRepository { ... }
Otra Impl:           class PrismaRepository implements IRepository { ... }
```

Cambias el adapter sin tocar el port.

### ✅ Domain Events

Cuando algo importante ocurre en dominio, **publica un evento**:

```typescript
// En InventoryItem.reserveStock():
this.addDomainEvent(
  new StockReservedEvent(this.id, this.sku.value, quantity.value),
);
```

Los módulos se suscriben:

```typescript
// En OrdersModule, cuando recibe StockReservedEvent:
eventSubscriber.subscribe('inventory.stock.reserved', async (event) => {
  // Lógica del módulo de órdenes
});
```

**Ventaja**: Los módulos NO se conocen entre sí. La comunicación es vía eventos.

### ✅ Transacciones

Necesitarás **Unit of Work** cuando guardes múltiples agregados:

```typescript
const unitOfWork = this.unitOfWorkFactory.create();
await unitOfWork.execute(async () => {
  await inventoryRepository.save(item);
  await orderRepository.save(order);
  // Ambos se guardan o ninguno. ACID garantizado.
});
```

(Lo implementaré en el próximo paso)

## 🧪 Testing

### Unit Tests (80% del código)

```typescript
describe('InventoryItem', () => {
  it('should reserve stock when available', () => {
    const item = InventoryItem.create(...);
    item.reserveStock(new Quantity(5));
    expect(item.reservedQuantity.value).toBe(5);
  });
});
```

Nota: **SIN frameworks**. Pura lógica.

### Integration Tests

```typescript
describe('AdjustInventoryService', () => {
  it('should publish event after adjusting', async () => {
    const service = new AdjustInventoryService(
      mockRepository,
      mockEventPublisher
    );
    await service.execute(...);
    expect(mockEventPublisher.publish).toHaveBeenCalled();
  });
});
```

### E2E Tests

```typescript
describe('Inventory API', () => {
  it('PATCH /inventory/:id should adjust quantity', async () => {
    const response = await request(app.getHttpServer())
      .patch('/inventory/123')
      .send({ quantity: 50, reason: 'Restock' });
    expect(response.status).toBe(204);
  });
});
```

## 🚀 Escalado a Microservicios

Cuando crezcas, extraes cada módulo a su propio servicio:

```
Monolito (Hoy)
├── Inventory Module
├── Orders Module
├── Customers Module
└── Payments Module

↓ Evolucionar a...

Microservicios (Mañana)
├── Inventory Service (su propio repo, DB, API)
├── Orders Service (su propio repo, DB, API)
├── Customers Service
└── Payments Service

Comunicación: Event Bus (RabbitMQ, Kafka)
```

El código ya está preparado porque:

- Cada módulo es independiente
- La comunicación es vía eventos (async)
- No hay acoplamiento directo

## 📋 Checklist para Cada Módulo

Cuando agregues un nuevo módulo (ej: Orders), sigue este patrón:

```
orders/
├── domain/
│   ├── order.entity.ts              ✓ Agregado + Value Objects
│   └── order.repository.ts          ✓ Port específico
├── application/
│   ├── services/
│   │   └── create-order.service.ts  ✓ Use cases
│   └── mappers/
│       └── order.mapper.ts          ✓ Domain ↔ DTO
├── infrastructure/
│   └── persistence/
│       ├── order.schema.ts          ✓ TypeORM schema
│       └── order.repository.ts      ✓ Implementación
├── presentation/
│   ├── dtos/
│   │   └── order.dto.ts            ✓ DTOs
│   └── order.controller.ts         ✓ Endpoints
└── orders.module.ts                ✓ Módulo NestJS
```

## 🔗 Comunicación Entre Módulos

### ❌ MAL (Acoplado)

```typescript
// OrdersService inyecta InventoryRepository
constructor(
  private inventoryRepository: IInventoryRepository
) {}

async createOrder() {
  const item = await this.inventoryRepository.findBySku(...);
  // Tight coupling! Si cambias inventory, rompes orders.
}
```

### ✅ BIEN (Desacoplado)

```typescript
// OrdersService escucha eventos de Inventory
eventSubscriber.subscribe('inventory.stock.reserved', async (event) => {
  // Reacciona al evento, sin conocer detalles de inventory
  await this.markOrderAsReserved(event.aggregateId);
});
```

## 📚 Referencias

- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **Domain-Driven Design**: Eric Evans
- **Hexagonal Architecture**: Alistair Cockburn
- **SOLID**: SOLID Principles by Uncle Bob

---

**Tl;DR**: La arquitectura separa **qué hace el negocio** (domain) de **cómo se hace técnicamente** (infrastructure). Esto permite testear, cambiar tecnologías, y escalar a microservicios sin dolor de cabeza.
