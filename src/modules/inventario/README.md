# Módulo INVENTARIO

Control de existencias, reservas y movimientos de stock.

## 🎯 Responsabilidades

- Mantener cantidad disponible por producto/paquete
- Crear reservas temporales (20 minutos)
- Registrar movimientos inmutables
- Detectar stock bajo (< umbral)
- Liberar reservas expiradas automáticamente

## 🏗 Arquitectura

Implementa **Hexagonal Architecture** con tres capas claramente delimitadas:

```
domain/           → Lógica de negocio (sin dependencias externas)
application/      → Orquestación de casos de uso (puertos)
infrastructure/   → Implementaciones concretas (Prisma, HTTP, etc.)
```

## 📦 Puertos Implementados

### Inbound (Casos de Uso)

- `reservarInventario()` - Reservar stock para venta/cambio
- `consolidarReserva()` - Consolidar venta exitosa
- `liberarReservasExpiradas()` - Job automático (cada minuto)
- `ajustarInventario()` - Ajuste manual
- `consultarDisponibilidad()` - Verificar stock
- `obtenerInventarioPorItem()` - Obtener datos
- `detectarStockBajo()` - Job diario (8 AM)

### Outbound (Adapters)

- `InventarioRepository` → PostgreSQL (persiste agregado completo)
- `EventBusPort` → Console (TODO: Redis)
- `ProductoPort` → TODO: CATALOGO
- `EmpleadoPort` → TODO: IDENTIDAD

## ⚡ Decisión Arquitectónica: Un Repository por Agregado

**IMPORTANTE**: Este módulo implementa DDD correctamente con **UN SOLO repository**
para todo el agregado `Inventario`, que incluye sus entidades internas:

- `Reserva`
- `MovimientoInventario`

### ¿Por qué un solo repository?

Un agregado existe para **garantizar invariantes de consistencia**. Si permitimos
que las entidades internas (`Reserva`, `MovimientoInventario`) se persistan
independientemente, perdemos:

1. ❌ **Control transaccional** - No hay atomicidad garantizada
2. ❌ **Invariantes** - Podemos romper reglas (ej: reservar más de lo disponible)
3. ❌ **Punto único de verdad** - El aggregate root deja de ser "root"
4. ❌ **Trazabilidad** - Los movimientos pueden quedar huérfanos

### Cómo funciona

Todas las operaciones de escritura en entidades internas DEBEN pasar por el
aggregate root `Inventario`. En vez de callbacks, usamos **parámetros declarativos**:

```typescript
// ❌ MAL - Bypass del agregado
const reserva = new Reserva(...);
await reservaRepository.guardar(reserva); // Viola invariantes

// ✅ BIEN - A través del agregado con parámetros declarativos
const inventario = await inventarioRepo.buscarPorId(id);
const reserva = inventario.reservar(props); // Valida reglas
await inventarioRepo.guardar(inventario, {
  reservas: { nuevas: [reserva] }  // Se persiste en la misma transacción
});
```

**Ventajas de este patrón**:

- ✅ Más declarativo (defines QUÉ persistir, no CÓMO)
- ✅ Más testeable (no hay callbacks que mockear)
- ✅ Type-safe (el compilador valida la estructura)
- ✅ Más legible (menos nesting)
- ✅ Transaccional (todo se guarda atómicamente)

### Ejemplos de Uso

```typescript
// Reservar inventario
const reserva = inventario.reservar(props);
await inventarioRepo.guardar(inventario, {
  reservas: { nuevas: [reserva] },
});

// Consolidar reserva (actualizar + crear movimiento)
reserva.consolidar();
const movimiento = inventario.consolidarReserva(reserva);
await inventarioRepo.guardar(inventario, {
  reservas: { actualizadas: [reserva] },
  movimientos: [movimiento],
});

// Ajuste manual (solo movimiento)
const movimiento = inventario.ajustar(props);
await inventarioRepo.guardar(inventario, {
  movimientos: [movimiento],
});
```

El `InventarioRepository` consolida:

- Escritura del aggregate root (con optimistic locking)
- Persistencia de entidades internas (dentro de la misma transacción)
- Queries de lectura (para todas las entidades)

### Referencias

- `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md` - Principios DDD
- `domain/ports/outbound/inventario.repository.ts` - Interfaz completa

## 🔌 Endpoints HTTP

```
POST   /inventario/reservar              Reservar stock
POST   /inventario/consolidar            Consolidar reserva
POST   /inventario/ajustar               Ajustar cantidad
GET    /inventario/disponibilidad        Verificar disponibilidad
GET    /inventario/item/:tipoItem/:itemId  Obtener inventario
```

## 🔄 Flujo de Reserva

```
1. Cliente agrega producto al carrito (PRE_VENTA)
2. Cliente inicia pago → COMERCIAL consulta disponibilidad
3. COMERCIAL solicita reserva a INVENTARIO
4. INVENTARIO descuenta disponible, crea reserva (20 min)
5. Si disponible: Cliente paga → Venta confirmada
6. INVENTARIO consolida reserva (descuenta definitivo)
7. Si NO paga: Job expira reserva después 20 min → devuelve stock
```

## 🔐 Optimistic Locking

Campo `version` en Inventario previene sobreventa en operaciones concurrentes:

```typescript
// Prisma verifica versión antes de actualizar
UPDATE inventario
SET version = version + 1
WHERE id = ? AND version = ?
```

## 📊 Estados de Reserva

- `ACTIVA` → Bloqueando stock (20 min)
- `CONSOLIDADA` → Venta confirmada (stock desconta)
- `LIBERADA` → Cancelada manualmente
- `EXPIRADA` → Timeout automático

## 🚀 Primeros Pasos

### 1. Instalar Dependencias

```bash
npm install @nestjs/schedule @nestjs/swagger swagger-ui-express
```

### 2. Ejecutar Migración

```bash
npm run db:migrate:dev
```

### 3. Registrar en AppModule

```typescript
import { InventarioModule } from './modules/inventario/infrastructure/inventario.module';

@Module({
  imports: [InventarioModule, ...],
})
export class AppModule {}
```

### 4. Iniciar

```bash
npm run start:dev
```

## 📚 Documentación

- **IMPLEMENTACION_COMPLETADA.md** - Resumen de todas las fases
- **INVENTARIO_CLAUDE.md** - Especificación de negocio
- **INVENTARIO_ENTITIES_CLAUDE.md** - Estructura de BD

## 🧪 Testing

Para testear la API localmente:

```bash
# Reservar
curl -X POST http://localhost:3000/inventario/reservar \
  -H "Content-Type: application/json" \
  -d '{
    "tipoItem": "PRODUCTO",
    "itemId": "123e4567-e89b-12d3-a456-426614174000",
    "cantidad": 5,
    "operacionId": "223e4567-e89b-12d3-a456-426614174000",
    "tipoOperacion": "VENTA",
    "actorTipo": "SISTEMA",
    "actorId": "323e4567-e89b-12d3-a456-426614174000"
  }'

# Consultar disponibilidad
curl http://localhost:3000/inventario/disponibilidad?tipoItem=PRODUCTO&itemId=123e4567-e89b-12d3-a456-426614174000&cantidad=5
```

## ✨ Características

✅ Reservas con expiración automática  
✅ Transacciones atómicas (Prisma)  
✅ Eventos de dominio para auditoría  
✅ Optimistic locking sin deadlocks  
✅ Repositorios inyectables  
✅ Separación de responsabilidades  
✅ Listo para escalar

## 📝 TODOs

- [ ] Instalar y configurar `@nestjs/schedule`
- [ ] Instalar y configurar `@nestjs/swagger`
- [ ] Implementar decoradores @Cron en jobs
- [ ] Implementar EventBusRedisAdapter
- [ ] Integrar ProductoPort con CATALOGO
- [ ] Integrar EmpleadoPort con IDENTIDAD
- [ ] Leer parámetros de CONFIGURACION
- [ ] Procesar eventos en COMUNICACION

## 🤝 Integraciones

Este módulo interactúa con:

- **PRE_VENTA**: Verifica disponibilidad para carrito
- **COMERCIAL**: Recibe eventos de Venta y Cambio
- **CATALOGO**: Valida que productos existan (TODO)
- **IDENTIDAD**: Valida permisos para ajustes (TODO)
- **COMUNICACION**: Procesa eventos → notificaciones
- **AUDITORIA**: Persiste eventos de dominio

---

**Status**: ✅ Listo para desarrollo
**Última actualización**: Enero 2026
