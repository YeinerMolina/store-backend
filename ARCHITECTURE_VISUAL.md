# Arquitectura - Diagrama Visual

## 1. Estructura General

```
┌─────────────────────────────────────────────────────────────────┐
│                          HTTP CLIENTS                            │
│                   (Web, Mobile, External APIs)                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP Requests
                      │
┌─────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Inventory  │  │   Orders     │  │  Customers   │   ...     │
│  │  Controller  │  │  Controller  │  │  Controller  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│        │                │                    │                   │
│        └────────────────┴────────────────────┴─────────────────┐ │
│                                                                 │ │
└─────────────────────────────────────────────────────────────┬──┘─┘
                                                              │
                                    Application Layer ───────┤
                                                              │
┌─────────────────────────────────────────────────────────┬──┘
│                APPLICATION LAYER                        │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ AdjustInventoryService│ │ CreateOrderService   │  │
│  │ (Orchestration)      │  │ (Orchestration)      │  │
│  └──────────────────────┘  └──────────────────────┘  │
│       │                           │                   │
│       ├──→ Mappers             ├──→ Mappers          │
│       │    (Domain ↔ DTO)      │    (Domain ↔ DTO)  │
│       │                         │                     │
└───────┼─────────────────────────┼──────────────────┬──┘
        │                         │                  │
        │       Domain Layer ─────┼──────────────────┤
        │                         │                  │
┌───────┴─────────────────────────┴──────────────┬──┘
│         DOMAIN LAYER (PURA LOGICA)             │
│                                                │
│  ┌────────────────────────────────────────┐  │
│  │     InventoryItem AggregateRoot        │  │
│  │                                        │  │
│  │  - id: string                          │  │
│  │  - sku: SKU (Value Object)             │  │
│  │  - quantity: Quantity (Value Object)   │  │
│  │  - reservedQuantity: Quantity          │  │
│  │                                        │  │
│  │  Methods:                              │  │
│  │  + create(...): InventoryItem          │  │
│  │  + reserveStock(qty): void             │  │
│  │  + releaseStock(qty): void             │  │
│  │  + adjustQuantity(qty): void           │  │
│  │  + isLowStock(): boolean               │  │
│  │                                        │  │
│  │  Events Emitted:                       │  │
│  │  • InventoryItemCreatedEvent           │  │
│  │  • StockReservedEvent                  │  │
│  │  • InventoryQuantityAdjustedEvent      │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │      Order AggregateRoot (Próximo)     │  │
│  │                                        │  │
│  │  - id: string                          │  │
│  │  - customerId: string                  │  │
│  │  - items: OrderItem[] (Value Objects)  │  │
│  │  - status: OrderStatus (Enum)          │  │
│  │  - totalAmount: Money (Value Object)   │  │
│  │  - shippingAddress: Address (VO)       │  │
│  └────────────────────────────────────────┘  │
│                                               │
└───────────────────────────────────────────────┘
        │                         │
        │   IInventoryRepository  │  IOrderRepository
        │   (Port/Interface)      │  (Port/Interface)
        │                         │
┌───────┴─────────────────────────┴───────────────────┐
│     INFRASTRUCTURE LAYER                            │
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │TypeOrmInventoryRepo  │  │TypeOrmOrderRepo  │   │
│  │(Port Implementation) │  │(Port Impl)       │   │
│  │                      │  │                  │   │
│  │+ save(entity)        │  │+ save(entity)    │   │
│  │+ findById(id)        │  │+ findById(id)    │   │
│  │+ findBySku(sku)      │  │+ findAll()       │   │
│  │+ findAll()           │  │+ delete(id)      │   │
│  └──────────────────────┘  └──────────────────┘   │
│       │                          │                 │
│       └──────────────────────────┴─────┬───────────┤
│                                        │           │
│                            TypeORM Connection       │
│                                        │           │
└────────────────────────────────────────┼───────────┘
                                         │
                       ┌─────────────────┴──────────────┐
                       │                                │
                    PostgreSQL Database          Cache (Redis)
                    ┌──────────────────┐         [Future]
                    │ inventory_items  │
                    │ orders           │
                    │ customers        │
                    │ payments         │
                    │ invoices         │
                    │ shipments        │
                    └──────────────────┘
```

---

## 2. Flujo de Request - Ejemplo: Ajustar Inventario

```
1. HTTP REQUEST
   ┌────────────────────────────────────────────┐
   │ PATCH /inventory/123                       │
   │ Body: { quantity: 50, reason: "Restock" }  │
   └──────────────────────┬──────────────────────┘
                          │
                          ▼
2. CONTROLLER
   ┌──────────────────────────────────────────────┐
   │ InventoryController.update()                 │
   │  - Valida request (ValidationPipe)           │
   │  - Delega a AdjustInventoryService           │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
3. APPLICATION SERVICE
   ┌────────────────────────────────────────────────┐
   │ AdjustInventoryService.execute()               │
   │                                                │
   │  a) Obtener agregado del repositorio           │
   │     repository.findById('123')                 │
   │                                                │
   │  b) Modificar agregado                         │
   │     inventoryItem.adjustQuantity(...)          │
   │                                                │
   │  c) Guardar cambios                            │
   │     repository.save(inventoryItem)             │
   │                                                │
   │  d) Publicar eventos                           │
   │     eventPublisher.publishMany(                │
   │       inventoryItem.getDomainEvents()          │
   │     )                                          │
   │                                                │
   │  e) Limpiar eventos                            │
   │     inventoryItem.clearDomainEvents()          │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
4. DOMAIN (PURE LOGIC)
   ┌──────────────────────────────────────────────┐
   │ InventoryItem.adjustQuantity()                │
   │                                               │
   │  - Validar cantidad es válida                 │
   │  - Actualizar cantidad                        │
   │  - Emitir evento de dominio                   │
   │    InventoryQuantityAdjustedEvent             │
   │                                               │
   │  (SIN FRAMEWORKS, SIN DEPENDENCIAS)           │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
5. INFRASTRUCTURE - PERSISTENCE
   ┌──────────────────────────────────────────────┐
   │ TypeOrmInventoryRepository.save()             │
   │                                               │
   │  - Convertir agregado a schema                │
   │  - Ejecutar INSERT/UPDATE en BD               │
   │  - Retornar confirmación                      │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │ PostgreSQL - UPDATE inventory_items SET...    │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
6. INFRASTRUCTURE - EVENTS
   ┌──────────────────────────────────────────────┐
   │ EventEmitterAdapter.publishMany()             │
   │                                               │
   │  - Emitir evento a subscribers                │
   │  - Otros módulos escuchan:                    │
   │                                               │
   │    Inventory: "quantity.adjusted"             │
   │       ↓                                       │
   │    Orders: "si necesita stock, reservar"      │
   │    Reports: "registrar cambio"                │
   │    Notifications: "enviar alerta"             │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
7. HTTP RESPONSE
   ┌──────────────────────────────────────────────┐
   │ 204 No Content                                │
   │ (o 200 con el inventario actualizado)         │
   └──────────────────────────────────────────────┘
```

---

## 3. Comunicación Entre Módulos (Event-Driven)

```
MÓDULO A (Inventory)                 MÓDULO B (Orders)
┌─────────────────────────┐          ┌──────────────────┐
│                         │          │                  │
│  InventoryItem.reserve()│          │ Order.create()   │
│       ▼                 │          │                  │
│  StockReservedEvent     │          │ Necesita validar │
│  emitted                │          │ stock disponible │
│       │                 │          │       ▲          │
│       │ PUBLISH          │          │       │          │
│       └──────────────────┼──────────┼───────┘          │
│                          │          │ SUBSCRIBE        │
│        EventEmitter      │          │                  │
│        (In-Process)      │          │                  │
│                          │          │                  │
│                          │          │ Cuando se reserva│
│                          │          │ → Registra orden │
│                          │          │   como Confirmed │
└─────────────────────────┘          └──────────────────┘

MICROSERVICIOS (Future):

INVENTORY SERVICE          EVENT BUS (RabbitMQ)        ORDERS SERVICE
┌──────────────────┐      ┌──────────────────────┐     ┌──────────────┐
│ StockReserved    │ ──▶  │ "stock.reserved"     │ ──▶ │ Listener     │
│ Event emitted    │      │                      │     │ Actualiza DB │
└──────────────────┘      │ (persistent queue)   │     └──────────────┘
                          └──────────────────────┘
```

---

## 4. Jerarquía de Entities y Value Objects

```
DOMAIN/
├── Entity (Base)
│   ├── ID único
│   ├── Método equals() por ID
│   └── Método unpack()
│
├── AggregateRoot (extends Entity)
│   ├── domain events
│   ├── addDomainEvent()
│   ├── getDomainEvents()
│   └── clearDomainEvents()
│
├── VALUE OBJECTS (Immutable)
│   ├── SKU
│   │   ├── value: string
│   │   └── equals(other: SKU)
│   │
│   ├── Quantity
│   │   ├── value: number (>= 0)
│   │   ├── add(q): Quantity
│   │   ├── subtract(q): Quantity
│   │   └── equals(other)
│   │
│   ├── Money (Future)
│   │   ├── amount: number
│   │   ├── currency: string
│   │   └── operations...
│   │
│   └── Address (Future)
│       ├── street, city, zip
│       └── equals()
│
└── DOMAIN EVENTS
    ├── DomainEvent (Base)
    │   ├── aggregateId
    │   ├── occurredAt
    │   └── getEventName()
    │
    ├── InventoryItemCreatedEvent
    ├── StockReservedEvent
    └── ... más eventos
```

---

## 5. Testing Pyramid

```
                    ▲
                   │  
                   ▼  E2E Tests (5%)
                ┌─────┐
                │ E2E │  - Flujo completo
                │API  │  - BD real o testdb
                └─────┘  - Simula cliente real
                   △
                   │
              Integration Tests (15%)
              ┌───────────┐
              │Integration│  - Service + Mock Repository
              │Tests      │  - Verificar coordinación
              └───────────┘
                   △
                   │
            Unit Tests (80%)
        ┌─────────────────────┐
        │  Unit Tests         │  - Entities puras
        │ (Domain + Mappers)  │  - Logic sin frameworks
        └─────────────────────┘
```

---

## 6. Dependency Injection (NestJS)

```
AppModule
├── imports: [
│   ├── TypeOrmModule.forRoot(...)
│   ├── EventEmitterModule.forRoot()
│   └── InventoryModule
│       └── imports: [TypeOrmModule.forFeature([InventoryItemSchema])]
│
└── providers (en cada módulo): [
    ├── AdjustInventoryService
    ├── {
    │   provide: 'INVENTORY_REPOSITORY_TOKEN',
    │   useClass: TypeOrmInventoryRepository ← Implementación
    │ }
    └── {
        provide: 'EventPublisher',
        useValue: new EventEmitterAdapter(...)
      }
]

Inyección en Services:
┌──────────────────────────────────────┐
│ AdjustInventoryService               │
│                                      │
│ constructor(                         │
│   @Inject('INVENTORY_REPOSITORY_..') │
│   private repo: IInventoryRepository,│ ← Interface (Port)
│                                      │
│   @Inject('EventPublisher')          │
│   private events: IEventPublisher     │ ← Interface
│ )                                    │
└──────────────────────────────────────┘

VENTAJA:
- En tests: inyectar MockRepository
- En prod: inyectar TypeOrmRepository
- En future: inyectar PrismaRepository
- CÓDIGO NO CAMBIA
```

---

## 7. Module Structure Template (Para cada nuevo módulo)

```
modules/
└── <MODULE_NAME>/
    │
    ├── domain/
    │   ├── <entity>.entity.ts          ← AggregateRoot
    │   │   - Value Objects
    │   │   - Domain Events
    │   │   - Business Logic
    │   │
    │   ├── <entity>.repository.ts       ← Port (Interface)
    │   └── exceptions/                  ← Domain-specific
    │       └── <custom>.exception.ts
    │
    ├── application/
    │   ├── services/
    │   │   ├── create-<entity>.service.ts
    │   │   ├── update-<entity>.service.ts
    │   │   └── delete-<entity>.service.ts
    │   │
    │   ├── mappers/
    │   │   └── <entity>.mapper.ts       ← Domain ↔ DTO
    │   │
    │   ├── __tests__/
    │   │   └── *.spec.ts                ← Unit & Integration
    │   └── queries/ (CQRS - Future)
    │
    ├── infrastructure/
    │   └── persistence/
    │       ├── <entity>.schema.ts       ← TypeORM Entity
    │       ├── <entity>.repository.ts   ← Port Implementation
    │       └── __tests__/
    │           └── *.spec.ts            ← Integration
    │
    ├── presentation/
    │   ├── dtos/
    │   │   └── <entity>.dto.ts
    │   ├── <entity>.controller.ts       ← HTTP Endpoints
    │   └── __tests__/
    │       └── *.spec.ts                ← E2E
    │
    └── <module>.module.ts               ← NestJS Module
```

---

## 8. Escalado a Microservicios

```
TODAY (Monolith):
┌────────────────────────────────────┐
│        Store API (Monolito)        │
│                                    │
│ ├── Inventory Module               │
│ ├── Orders Module                  │
│ ├── Customers Module               │
│ ├── Payments Module                │
│ └── ... más módulos                │
│                                    │
│ Comunicación: Sync (llamadas)      │
│             Async (EventEmitter)   │
└────────────────────────────────────┘
         │
         └─→ Single PostgreSQL DB


TOMORROW (Microservices):
┌──────────────────┐  ┌────────────────┐  ┌───────────────┐
│ Inventory Service│  │  Orders Service│  │Customers Svc  │
│                  │  │                │  │               │
│ ./modules/invent.│  │ ./modules/orders│ │ ./modules/cust│
│ + own DB         │  │ + own DB       │  │ + own DB      │
└────────┬─────────┘  └────────┬───────┘  └────────┬──────┘
         │                     │                   │
         └─────────────────────┼───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Event Bus        │
                    │  (RabbitMQ/Kafka)  │
                    └───────────────────┘


¿CÓMO MIGRAR?
Sin cambios de código.
Solo cambias:
1. EventEmitterAdapter → RabbitMQAdapter
2. Levantas cada módulo en puerto diferente
3. Apuntas cada módulo a su propia BD
4. El Bus maneja eventos entre servicios

PORQUE: Ya está desacoplado vía eventos.
```

---

Este es el patrón que vas a seguir en cada módulo. Entiéndelo bien, porque es tu referencia para los próximos meses.

