# Roadmap de Desarrollo

## ✅ Completado (Foundation)

1. **Arquitectura base** ✓
   - Clean Architecture + DDD + Hexagonal
   - Shared domain (Entity, AggregateRoot, ValueObject, Exceptions)
   - Ports & Adapters (Repository, EventPublisher)
   - TypeORM integration
   - EventEmitter2 para eventos

2. **Primer módulo: Inventory** ✓
   - Domain: InventoryItem aggregate, SKU, Quantity value objects
   - Application: AdjustInventoryService
   - Infrastructure: TypeOrmInventoryRepository
   - Presentation: InventoryController
   - Domain Events: InventoryItemCreatedEvent, InventoryQuantityAdjustedEvent, StockReservedEvent, StockReleasedEvent

3. **Documentación** ✓
   - ARCHITECTURE.md (explicación completa)
   - SETUP.md (cómo empezar)
   - Este ROADMAP.md

---

## 📋 Próximos Pasos (En orden)

### Fase 1: Completar Inventory (1-2 semanas)

- [ ] **Tests unitarios** para InventoryItem
  - Crear `src/modules/inventory/domain/__tests__/inventory-item.spec.ts`
  - Tests: create, reserveStock, releaseStock, adjustQuantity, isLowStock
  
- [ ] **Tests de integración** para AdjustInventoryService
  - Crear `src/modules/inventory/application/__tests__/adjust-inventory.service.spec.ts`
  - Mockear repository y eventPublisher
  
- [ ] **Crear más endpoints** en InventoryController
  - `POST /inventory` → Crear nuevo item
  - `GET /inventory` → Listar todos (con paginación)
  - `GET /inventory/sku/:sku` → Buscar por SKU
  - `GET /inventory/low-stock` → Items bajo threshold
  - `POST /inventory/:id/reserve` → Reservar stock
  - `POST /inventory/:id/release` → Liberar reserva
  - `DELETE /inventory/:id` → Eliminar

- [ ] **Validaciones en DTO**
  - Instalar `class-validator` (ya está)
  - Agregar decorators: `@IsString()`, `@IsNumber()`, etc
  - Usar `ValidationPipe` en `main.ts`

- [ ] **Migrations (TypeORM)**
  - `npm install typeorm-cli`
  - Crear `src/migrations/` con versiones de BD

### Fase 2: Autenticación & Autorización (1-2 semanas)

- [ ] **Crear módulo Auth**
  ```
  modules/auth/
  ├── domain/
  │   ├── user.entity.ts (User aggregate)
  │   ├── credentials.value-object.ts
  │   └── user.repository.ts
  ├── application/
  │   ├── services/
  │   │   ├── login.service.ts
  │   │   ├── register.service.ts
  │   │   └── refresh-token.service.ts
  │   └── mappers/
  │       └── user.mapper.ts
  ├── infrastructure/
  │   └── persistence/
  │       ├── user.schema.ts
  │       └── user.repository.ts
  ├── presentation/
  │   ├── dtos/
  │   └── auth.controller.ts
  └── auth.module.ts
  ```

- [ ] **JWT Implementation**
  - Instalar `@nestjs/jwt`
  - Crear estrategia JWT
  - Guards para proteger endpoints
  - Refresh tokens

- [ ] **RBAC (Role-Based Access Control)**
  - Roles: Admin, Manager, Customer
  - Decorators: `@Roles('Admin')`, `@IsOwner()`, etc
  - Guards que verifican roles

### Fase 3: Módulo Customers (1-2 semanas)

- [ ] **Customer Aggregate**
  - Email, Name, Address value objects
  - Status (Active, Inactive, Banned)
  - Contact info, preferences

- [ ] **Customer Service**
  - Create, Update, Delete, Find
  - Validaciones de email único
  - Soft deletes

- [ ] **Event Listeners**
  - Cuando se registra un customer → publicar `CustomerRegisteredEvent`
  - Otros módulos escuchan (ej: enviar welcome email)

### Fase 4: Módulo Orders (2-3 semanas)

**Este es el más complejo porque orquesta todo:**

- [ ] **Order Aggregate**
  - OrderItem value objects
  - Status: Pending, Confirmed, Shipped, Delivered, Cancelled
  - Total amount, shipping address, etc

- [ ] **Create Order Service**
  - Recibe items (productId, quantity)
  - Validar: stock disponible en Inventory
  - Validar: customer existe
  - Crear order
  - Publicar evento: `OrderCreatedEvent`

- [ ] **Order Listeners** (aquí es donde brilla el event-driven)
  - Escuchar `OrderCreatedEvent` → Reservar stock en Inventory
  - Escuchar `OrderCreatedEvent` → Enviar email de confirmación
  - Escuchar `OrderCreatedEvent` → Crear factura
  - Escuchar `PaymentProcessedEvent` → Cambiar status a Confirmed

- [ ] **E2E Flow**
  ```
  POST /orders (cliente hace pedido)
    ↓ (validar stock, crear order)
  Order Created Event
    ↓ (Inventory reserva stock)
  Stock Reserved Event
    ↓ (Invoices genera factura)
  Invoice Created Event
    ↓ (customer recibe emails)
  Emails sent
  ```

### Fase 5: Módulo Payments (1-2 semanas)

- [ ] **Stripe Integration**
  - Instalar `stripe`
  - PaymentIntent port/adapter
  - Webhook handling para confirmación

- [ ] **Payment Aggregate**
  - Amount, currency, status, order_id
  - Transitions: Pending → Processing → Completed/Failed

- [ ] **Create Payment Service**
  - Recibe order_id
  - Crea PaymentIntent en Stripe
  - Retorna client_secret para frontend

- [ ] **Webhook Handler**
  - Escucha `payment_intent.succeeded` de Stripe
  - Publica `PaymentProcessedEvent`

### Fase 6: Módulo Invoices (1-2 semanas)

- [ ] **Invoice Aggregate**
  - Number (generado secuencial), customer, items, total, tax
  - Status: Draft, Issued, Paid, Overdue, Cancelled

- [ ] **Generate Invoice Service**
  - Escucha `OrderCreatedEvent` o `PaymentProcessedEvent`
  - Genera número secuencial
  - Crea documento

- [ ] **PDF Generation**
  - Instalar `pdfkit` o `puppeteer`
  - Convertir invoice a PDF
  - Guardar en storage (S3, local)

### Fase 7: Módulo Shipments (1-2 semanas)

- [ ] **Shipment Aggregate**
  - Order, tracking_number, carrier, status
  - Status: Pending, Picked, Shipped, In Transit, Delivered, Failed

- [ ] **Integration con proveedores**
  - Port: `IShippingProvider` (abstract)
  - Adapters: `ShippoAdapter`, `EasypostAdapter`, etc
  - Permite cambiar proveedor sin código change

- [ ] **Event-driven**
  - Escucha `OrderConfirmedEvent` → crear shipment
  - Publica `ShipmentCreatedEvent` → enviar tracking al customer
  - Webhook de carrier → actualizar status

### Fase 8: Módulo Suppliers (1 semana)

- [ ] **Supplier Aggregate**
  - Name, contact, payment terms, status
  - Product list

- [ ] **Restock Service**
  - Escucha `InventoryLowStockEvent`
  - Crea purchase order con supplier
  - Publica `PurchaseOrderCreatedEvent`

---

## 🔧 Tareas Transversales

### Testing
- [ ] Unit tests para cada entidad de dominio (80% código base)
- [ ] Integration tests para cada service
- [ ] E2E tests para flujos críticos

### DevOps
- [ ] Docker & docker-compose
- [ ] CI/CD (GitHub Actions)
- [ ] Migrations automáticas en deploy

### Monitoring
- [ ] Logging centralized (Winston)
- [ ] Error tracking (Sentry)
- [ ] Metrics (Prometheus)

### Documentación
- [ ] API docs (Swagger/OpenAPI)
- [ ] Ejemplo de requests/responses
- [ ] Guía de contribución

---

## 📊 Estimación

- **Inventory (completado)**: ✅ Done
- **Auth + RBAC**: 2 semanas
- **Customers**: 1 semana
- **Orders**: 3 semanas (más complejo)
- **Payments**: 1.5 semanas
- **Invoices**: 1.5 semanas
- **Shipments**: 1.5 semanas
- **Suppliers**: 1 semana
- **Testing full**: 2 semanas
- **DevOps + Deploy**: 1 semana

**Total**: ~15 semanas (~4 meses) de desarrollo dedicado.

---

## 💡 Notas Importantes

1. **No hagas todo de una vez**. Cada módulo debe funcionar independientemente primero, luego intégralos vía eventos.

2. **Tests mientras desarrollas**. No esperes a tener todo hecho.

3. **Event-driven es la clave**. Cuando Inventory y Orders estén separados por eventos, podés extraerlos a microservicios después sin cambios.

4. **Validaciones en dos niveles**:
   - DTO level: `@IsString()`, `@Min()` (HTTP validation)
   - Domain level: Lógica de negocio compleja (dentro de entities)

5. **Error handling**:
   - Domain exceptions → Traducir a HTTP responses (401, 404, 422, etc)
   - Usar exception filters en NestJS

6. **Cada módulo exporta**:
   - Sus repositories (otros módulos pueden leerlos)
   - Sus eventos (otros módulos se suscriben)
   - NUNCA exporta domain objects directamente

---

## 🚀 Próximo Paso Inmediato

**Escribe tests para Inventory** (domain + application)

Abre `src/modules/inventory/domain/__tests__/inventory-item.spec.ts` y testea:
```typescript
describe('InventoryItem', () => {
  describe('create', () => {
    it('should create with valid params')
    it('should throw if SKU is empty')
    it('should throw if quantity is negative')
  })
  
  describe('reserveStock', () => {
    it('should reserve when available')
    it('should throw if insufficient stock')
  })
  
  describe('isLowStock', () => {
    it('should return true when quantity <= threshold')
    it('should return false when quantity > threshold')
  })
})
```

Esto valida que la arquitectura está bien y que entendés cómo funciona el dominio.

