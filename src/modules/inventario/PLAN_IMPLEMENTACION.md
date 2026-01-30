# Plan de Implementación - Módulo INVENTARIO

**Fecha**: 30 Enero 2026  
**Versión**: 1.0  
**Módulo**: INVENTARIO

---

## Objetivo

Completar la implementación del módulo INVENTARIO con funcionalidades críticas para producción, dejando los tests para el final cuando toda la lógica esté consolidada.

---

## Orden de Implementación

### 1. Jobs Automáticos (CRÍTICO)

**Prioridad**: 🔴 ALTA  
**Impacto**: Sin esto, las reservas expiradas bloquean inventario indefinidamente  
**Dependencias**: Ninguna

#### Tareas

- [ ] Instalar dependencia `@nestjs/schedule`

  ```bash
  npm install @nestjs/schedule
  ```

- [ ] Importar `ScheduleModule` en `app.module.ts`

  ```typescript
  import { ScheduleModule } from '@nestjs/schedule';

  @Module({
    imports: [
      ScheduleModule.forRoot(),
      // ... otros módulos
    ],
  })
  ```

- [ ] Agregar decorador `@Cron` a `liberarReservasExpiradas()`
  - **Frecuencia**: Cada minuto (`'* * * * *'`)
  - **Razón**: Reservas expiran a los 20 minutos, necesitamos detectarlas rápido
- [ ] Agregar decorador `@Cron` a `detectarStockBajo()`
  - **Frecuencia**: Diario a las 8:00 AM (`'0 8 * * *'`)
  - **Razón**: No es crítico en tiempo real, una vez al día es suficiente

- [ ] Agregar logging a los jobs (usar `console.log` por ahora, mejorar en paso 3)

- [ ] Agregar manejo de errores robusto
  - Try-catch con log de error
  - No debe tirar el job si falla una iteración

#### Archivos a Modificar

- `src/modules/inventario/infrastructure/jobs/inventario-jobs.service.ts`
- `src/app.module.ts` (importar ScheduleModule)
- `src/modules/inventario/infrastructure/inventario.module.ts` (exportar InventarioJobsService si no está)

#### Criterios de Aceptación

- ✅ Job de liberación corre cada minuto automáticamente
- ✅ Job de detección de stock bajo corre diario a las 8 AM
- ✅ Logs indican ejecución exitosa o fallida
- ✅ Si un job falla, no afecta la próxima ejecución

#### Validación Manual

```bash
# Iniciar aplicación
npm run start:dev

# Observar logs cada minuto:
# [JOB] Reservas expiradas liberadas

# Crear una reserva con fecha_expiracion en el pasado (vía SQL)
# Esperar 1 minuto
# Verificar que la reserva cambió a estado EXPIRADA
```

---

### 2. Event Bus con Redis (CRÍTICO)

**Prioridad**: 🔴 ALTA  
**Impacto**: Sin esto, los eventos de dominio se pierden y no hay auditoría  
**Dependencias**: Ninguna (Redis debe estar corriendo)

#### Tareas

- [ ] Instalar dependencias

  ```bash
  npm install ioredis
  npm install -D @types/ioredis
  ```

- [ ] Crear configuración de Redis
  - **Archivo**: `src/shared/infrastructure/redis/redis.config.ts`
  - **Variables de entorno**:
    - `REDIS_HOST` (default: localhost)
    - `REDIS_PORT` (default: 6379)
    - `REDIS_PASSWORD` (opcional)
    - `REDIS_DB` (default: 0)

- [ ] Crear `RedisEventBusAdapter` implementando `EventBusPort`
  - **Archivo**: `src/shared/infrastructure/event-bus/redis-event-bus.adapter.ts`
  - **Estrategia**: Pub/Sub de Redis
  - **Formato de canal**: `domain_events:{aggregate_type}`
  - **Payload**: JSON con evento serializado

- [ ] Implementar método `publish(event: EventoDominio)`
  - Serializar evento a JSON
  - Publicar en canal correspondiente
  - Log de publicación exitosa/fallida

- [ ] Implementar método `subscribe(pattern: string, handler: Function)` (opcional para fase 1)
  - Solo si otros módulos necesitan consumir eventos

- [ ] Reemplazar `EventBusConsoleAdapter` por `RedisEventBusAdapter` en `inventario.module.ts`

- [ ] Crear módulo global `EventBusModule` en `shared/`
  - Exportar provider `EVENT_BUS_PORT_TOKEN`
  - Reutilizable por todos los módulos

#### Archivos a Crear

- `src/shared/infrastructure/redis/redis.config.ts`
- `src/shared/infrastructure/redis/redis.service.ts` (wrapper de ioredis)
- `src/shared/infrastructure/event-bus/redis-event-bus.adapter.ts`
- `src/shared/infrastructure/event-bus/event-bus.module.ts`

#### Archivos a Modificar

- `src/modules/inventario/infrastructure/inventario.module.ts` (importar EventBusModule)
- `.env` (agregar variables de Redis)

#### Criterios de Aceptación

- ✅ Eventos se publican en Redis Pub/Sub
- ✅ Formato del mensaje es JSON válido
- ✅ Canal de publicación sigue convención `domain_events:{aggregate}`
- ✅ Si Redis cae, la aplicación loguea error pero no crashea
- ✅ Eventos incluyen metadata: `timestamp`, `aggregate_id`, `event_type`

#### Validación Manual

```bash
# Terminal 1: Redis CLI
redis-cli
SUBSCRIBE domain_events:inventario

# Terminal 2: Aplicación
npm run start:dev

# Terminal 3: Crear inventario vía API
curl -X POST http://localhost:3000/inventario \
  -H "Content-Type: application/json" \
  -d '{"tipoItem":"PRODUCTO","itemId":"...","cantidadInicial":100}'

# Verificar en Terminal 1 que se recibe:
# {"eventType":"InventarioCreado","aggregateId":"...","timestamp":"..."}
```

---

### 3. Logging Estructurado (IMPORTANTE)

**Prioridad**: 🟡 MEDIA  
**Impacto**: Sin esto, debuggear producción es un infierno  
**Dependencias**: Ninguna

#### Tareas

- [ ] Instalar Pino (logger rápido y estructurado)

  ```bash
  npm install pino pino-pretty
  npm install nestjs-pino
  ```

- [ ] Configurar `LoggerModule` global
  - **Archivo**: `src/shared/infrastructure/logging/logger.module.ts`
  - **Niveles**: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
  - **Formato desarrollo**: Pretty (legible)
  - **Formato producción**: JSON (para aggregators como ELK)

- [ ] Crear wrapper `AppLogger` con métodos tipados
  - `logger.info(message, context?)`
  - `logger.error(message, error, context?)`
  - `logger.warn(message, context?)`
  - `logger.debug(message, context?)`

- [ ] Reemplazar todos los `console.log` por `logger.{level}`
  - `inventario-jobs.service.ts`
  - `inventario-application.service.ts`
  - `event-bus-console.adapter.ts` → `redis-event-bus.adapter.ts`

- [ ] Agregar contexto de dominio a cada log

  ```typescript
  logger.info('Reserva creada', {
    module: 'INVENTARIO',
    operation: 'reservarInventario',
    inventarioId: '...',
    cantidad: 10,
  });
  ```

- [ ] Configurar rotación de archivos de log (opcional)
  - Usar `pino-roll` o similar
  - Max 50MB por archivo
  - Retener últimos 10 archivos

#### Archivos a Crear

- `src/shared/infrastructure/logging/logger.module.ts`
- `src/shared/infrastructure/logging/logger.service.ts`
- `src/shared/infrastructure/logging/pino.config.ts`

#### Archivos a Modificar

- `src/app.module.ts` (importar LoggerModule global)
- `src/modules/inventario/infrastructure/jobs/inventario-jobs.service.ts`
- `src/modules/inventario/application/services/inventario-application.service.ts`
- `src/modules/inventario/infrastructure/adapters/event-bus-*.adapter.ts`

#### Criterios de Aceptación

- ✅ Logs en desarrollo son legibles (pretty print)
- ✅ Logs en producción son JSON estructurado
- ✅ Cada log tiene timestamp, nivel, mensaje y contexto
- ✅ No quedan `console.log` en el código (salvo main.ts para bootstrap)
- ✅ Errores incluyen stack trace completo

#### Validación Manual

```bash
# Desarrollo (pretty)
NODE_ENV=development npm run start:dev
# Ver logs coloreados y legibles

# Producción (JSON)
NODE_ENV=production npm run start:prod
# Ver logs como:
# {"level":30,"time":1706580000000,"msg":"Reserva creada","module":"INVENTARIO",...}
```

---

### 4. Puerto a CONFIGURACION (IMPORTANTE)

**Prioridad**: 🟡 MEDIA  
**Impacto**: Sin esto, parámetros operativos requieren redeploy para cambiar  
**Dependencias**: Módulo CONFIGURACION debe existir (puede ser stub inicial)

#### Tareas

- [ ] Crear puerto outbound `ConfiguracionPort`
  - **Archivo**: `src/modules/inventario/domain/ports/outbound/configuracion.port.ts`
  - **Métodos**:
    - `obtenerDuracionReservaVenta(): Promise<number>`
    - `obtenerDuracionReservaCambio(): Promise<number>`
    - `obtenerUmbralStockBajo(): Promise<number>`

- [ ] Crear adaptador stub (mientras CONFIGURACION no existe)
  - **Archivo**: `src/modules/inventario/infrastructure/adapters/configuracion-stub.adapter.ts`
  - **Implementación**: Retorna valores hardcodeados (20, 20, 10)

- [ ] Inyectar `ConfiguracionPort` en `InventarioApplicationService`
  - Agregar al constructor
  - Agregar token `CONFIGURACION_PORT_TOKEN`

- [ ] Reemplazar constantes hardcodeadas

  ```typescript
  // ANTES
  private readonly DURACION_RESERVA_VENTA_MINUTOS = 20;

  // DESPUÉS
  const duracion = await this.configuracionPort.obtenerDuracionReservaVenta();
  ```

- [ ] Agregar caché de configuración (opcional, mejora performance)
  - Cachear valores por 15 minutos
  - Invalidar caché al recibir evento `ConfiguracionActualizada`

- [ ] Cuando CONFIGURACION esté implementado, crear adaptador real
  - **Archivo**: `src/modules/inventario/infrastructure/adapters/configuracion-http.adapter.ts`
  - **Estrategia**: HTTP client a endpoint de CONFIGURACION
  - O: `src/modules/inventario/infrastructure/adapters/configuracion-direct.adapter.ts`
  - **Estrategia**: Inyectar `ConfiguracionService` directamente (sin HTTP)

#### Archivos a Crear

- `src/modules/inventario/domain/ports/outbound/configuracion.port.ts`
- `src/modules/inventario/domain/ports/tokens.ts` (agregar `CONFIGURACION_PORT_TOKEN`)
- `src/modules/inventario/infrastructure/adapters/configuracion-stub.adapter.ts`

#### Archivos a Modificar

- `src/modules/inventario/application/services/inventario-application.service.ts`
- `src/modules/inventario/infrastructure/inventario.module.ts` (agregar provider)

#### Criterios de Aceptación

- ✅ No hay constantes hardcodeadas en `InventarioApplicationService`
- ✅ Valores vienen de `ConfiguracionPort`
- ✅ Stub adapter funciona sin necesidad de CONFIGURACION real
- ✅ Es fácil reemplazar stub por adaptador real cuando CONFIGURACION exista
- ✅ Si configuración falla, usa valores por defecto y loguea warning

#### Validación Manual

```bash
# Con stub (valores default)
npm run start:dev
# Crear reserva → verificar que expira a los 20 minutos

# Cuando CONFIGURACION exista:
# Cambiar DURACION_RESERVA_VENTA a 10 en BD
# Crear reserva → verificar que expira a los 10 minutos
```

---

### 5. Mejoras Complementarias (OPCIONAL)

**Prioridad**: Variable según sub-tarea  
**Impacto**: Mejoran producción pero no son bloqueantes  
**Dependencias**: Pasos 1-4 completados

---

#### 5.1. Índices de Performance (🟡 PRIORIDAD ALTA)

**Razón**: Mejora performance de queries críticas (job de expiración, consultas frecuentes)  
**Esfuerzo**: 1 hora  
**Impacto**: Mejora velocidad de job de liberación en 10x cuando hay miles de reservas

**Tareas**:

- [ ] Crear migración de Prisma con índice compuesto:

  ```sql
  CREATE INDEX idx_reserva_estado_expiracion
  ON reserva(estado, fecha_expiracion)
  WHERE estado = 'ACTIVA';
  ```

- [ ] Índice para búsquedas frecuentes de movimientos:
  ```sql
  CREATE INDEX idx_movimiento_inventario_fecha
  ON movimiento_inventario(inventario_id, fecha_movimiento DESC);
  ```

**Validación**:

```bash
# Explicar query del job
EXPLAIN ANALYZE SELECT * FROM reserva
WHERE estado = 'ACTIVA' AND fecha_expiracion < NOW();
# Debe usar idx_reserva_estado_expiracion
```

---

#### 5.2. Health Check (🟡 PRIORIDAD ALTA)

**Razón**: Esencial para monitoreo en producción (Kubernetes liveness/readiness)  
**Esfuerzo**: 2 horas  
**Impacto**: Permite detectar problemas antes de que afecten usuarios

**Tareas**:

- [ ] Instalar `@nestjs/terminus`

  ```bash
  npm install @nestjs/terminus
  ```

- [ ] Crear `HealthController` en `infrastructure/controllers/`

- [ ] Crear endpoint `GET /inventario/health`
  - **Liveness**: `/health/live` (app está corriendo)
  - **Readiness**: `/health/ready` (app puede recibir tráfico)

- [ ] Verificar en readiness:
  - Conexión a PostgreSQL (via Prisma: `SELECT 1`)
  - Conexión a Redis (via EventBus: `PING`)
  - Última ejecución de job de liberación (< 2 minutos)
  - Cantidad de reservas expiradas pendientes (< 100)

**Criterios de aceptación**:

- ✅ `GET /health/live` retorna 200 si app corre
- ✅ `GET /health/ready` retorna 200 solo si todas las dependencias ok
- ✅ `GET /health/ready` retorna 503 si Redis/Postgres caídos

---

#### 5.3. Validación Avanzada de Input (🟡 PRIORIDAD MEDIA)

**Razón**: Previene bugs y mejora mensajes de error  
**Esfuerzo**: 2 horas  
**Impacto**: Reduce errores 500, mejora UX con errores 400 claros

**Tareas**:

- [ ] Validar que UUIDs sean válidos (formato v4 o v7)

  ```typescript
  // En schemas Zod
  const uuidSchema = z.string().uuid();
  ```

- [ ] Validar que `cantidad` sea > 0

  ```typescript
  cantidad: z.number().int().positive();
  ```

- [ ] Validar que `tipoItem` sea enum válido

  ```typescript
  tipoItem: z.enum(['PRODUCTO', 'PAQUETE']);
  ```

- [ ] Mejorar mensajes de error de validación
  - Usar `.refine()` de Zod con mensajes custom

**Criterios de aceptación**:

- ✅ UUID inválido → 400 con mensaje "UUID inválido en campo X"
- ✅ Cantidad 0 → 400 con mensaje "Cantidad debe ser mayor a 0"
- ✅ TipoItem inválido → 400 con mensaje "TipoItem debe ser PRODUCTO o PAQUETE"

---

#### 5.4. Soft Delete Completo (🟡 PRIORIDAD MEDIA)

**Razón**: Evita mostrar inventarios eliminados, permite restauración  
**Esfuerzo**: 2 horas  
**Impacto**: Mejora integridad de datos, evita confusión

**Tareas**:

- [ ] Agregar filtro global `WHERE deleted = false` en repositorio
  - Modificar todos los métodos `buscar*()` para excluir `deleted = true`

- [ ] Crear método `restaurarInventario(id: string)` en servicio
  - Cambiar `deleted` de `true` a `false`
  - Emitir evento `InventarioRestaurado`

- [ ] Endpoint `PATCH /inventario/:id/restaurar`

**Criterios de aceptación**:

- ✅ `buscarTodos()` no retorna inventarios eliminados
- ✅ `buscarPorId()` retorna null si inventario está eliminado
- ✅ `restaurarInventario()` permite reactivar inventario eliminado

---

#### 5.5. Documentación Swagger Completa (🟡 PRIORIDAD MEDIA)

**Razón**: Facilita integración para frontend y otros equipos  
**Esfuerzo**: 1.5 horas  
**Impacto**: Reduce fricción en desarrollo de clientes API

**Tareas**:

- [ ] Agregar ejemplos de respuestas de error en decoradores

  ```typescript
  @ApiResponse({ status: 400, description: 'DTO inválido', type: ErrorDto })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  @ApiResponse({ status: 409, description: 'Stock insuficiente o conflicto de versión' })
  ```

- [ ] Validar que todos los DTOs tengan `@ApiProperty()` con descripciones

- [ ] Agregar descripción de negocio a cada endpoint

  ```typescript
  @ApiOperation({
    summary: 'Reserva inventario para venta',
    description: 'Bloquea stock por 20 minutos mientras se completa el pago'
  })
  ```

- [ ] Agregar tags para agrupar endpoints relacionados
  ```typescript
  @ApiTags('Inventario - Operaciones', 'Inventario - Consultas')
  ```

**Validación**:

```bash
# Abrir Swagger UI
open http://localhost:3000/api/docs
# Verificar que todos los endpoints tienen ejemplos y descripciones claras
```

---

#### 5.6. Paginación (🟢 PRIORIDAD BAJA)

**Razón**: Evita cargar miles de registros en endpoints de listado  
**Esfuerzo**: 2 horas  
**Impacto**: Mejora performance de API en catálogos grandes

**Tareas**:

- [ ] Agregar parámetros `limit` y `offset` a `buscarTodos()`

  ```typescript
  async buscarTodos(
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedResult<Inventario>>
  ```

- [ ] Retornar metadata de paginación

  ```typescript
  {
    data: Inventario[],
    pagination: {
      total: 100,
      page: 1,
      pageSize: 20,
      totalPages: 5
    }
  }
  ```

- [ ] Agregar query params en controller
  ```typescript
  @Get()
  async buscarTodos(
    @Query('limit') limit = 20,
    @Query('offset') offset = 0
  )
  ```

**Criterios de aceptación**:

- ✅ `GET /inventario?limit=10&offset=0` retorna 10 registros
- ✅ Metadata incluye total de registros disponibles
- ✅ Default es limit=20, offset=0 si no se especifica

---

#### 5.7. README del Módulo (🟢 PRIORIDAD BAJA)

**Razón**: Facilita onboarding de nuevos devs  
**Esfuerzo**: 1 hora  
**Impacto**: Reduce tiempo de ramp-up de nuevos devs

**Tareas**:

- [ ] Crear `src/modules/inventario/README.md`

- [ ] Secciones:
  - **Descripción del módulo**: Responsabilidad y bounded context
  - **Casos de uso principales**: Reservar, consolidar, ajustar
  - **Flujo de reserva → consolidación**: Diagrama de secuencia
  - **Cómo correr tests**: Comandos y setup necesario
  - **Cómo agregar nuevos tipos de movimiento**: Pasos para extender enum
  - **Diagrama de estados de Reserva**: Máquina de estados (ACTIVA → CONSOLIDADA/LIBERADA/EXPIRADA)

- [ ] Agregar ejemplos de uso con curl
  ```bash
  # Crear inventario
  curl -X POST http://localhost:3000/inventario \
    -H "Content-Type: application/json" \
    -d '{"tipoItem":"PRODUCTO","itemId":"...","cantidadInicial":100}'
  ```

**Validación**: Nuevo dev puede leer README y entender módulo en 15 minutos

---

#### 5.8. Métricas (Prometheus) (🟢 PRIORIDAD BAJA)

**Razón**: Observabilidad avanzada para producción  
**Esfuerzo**: 3 horas  
**Impacto**: Permite alertas proactivas y dashboards de negocio

**Tareas**:

- [ ] Instalar `@willsoto/nestjs-prometheus`

  ```bash
  npm install @willsoto/nestjs-prometheus prom-client
  ```

- [ ] Importar `PrometheusModule` en app.module

- [ ] Exponer endpoint `/metrics`

- [ ] Agregar métricas de negocio:

  ```typescript
  @InjectMetric('inventario_reservas_activas_total')
  private reservasActivasGauge: Gauge;

  @InjectMetric('inventario_stock_disponible')
  private stockDisponibleGauge: Gauge;

  @InjectMetric('inventario_operaciones_total')
  private operacionesCounter: Counter;
  ```

- [ ] Actualizar métricas en cada operación:
  ```typescript
  async reservarInventario(...) {
    // ... lógica
    this.operacionesCounter.inc({ tipo: 'RESERVA' });
    this.reservasActivasGauge.set(totalReservasActivas);
  }
  ```

**Validación**:

```bash
# Verificar métricas expuestas
curl http://localhost:3000/metrics | grep inventario

# Debe mostrar:
# inventario_reservas_activas_total 15
# inventario_stock_disponible{producto_id="..."} 100
# inventario_operaciones_total{tipo="RESERVA"} 42
```

---

### 6. Tests Completos (FINAL)

**Prioridad**: 🔴 CRÍTICA (para producción)  
**Timing**: Cuando toda la lógica de negocio esté implementada y estable  
**Coverage objetivo**: > 80%

#### 6.1. Tests Unitarios de Dominio

**Alcance**: Entidades, Value Objects, Factories (sin dependencias externas)

- [ ] **Inventario Entity**
  - [ ] `reservar()` descuenta disponible y suma reservado
  - [ ] `reservar()` lanza `StockInsuficienteError` si no hay stock
  - [ ] `consolidarReserva()` descuenta reservado
  - [ ] `liberarReserva()` suma disponible y descuenta reservado
  - [ ] `ajustar()` modifica cantidad_disponible correctamente
  - [ ] `incrementarVersion()` incrementa campo version
  - [ ] `eliminar()` marca deleted = true

- [ ] **Reserva Entity**
  - [ ] `crear()` genera fecha_expiracion correcta (now + 20 min)
  - [ ] `consolidar()` cambia estado a CONSOLIDADA
  - [ ] `liberar()` cambia estado a LIBERADA
  - [ ] `expirar()` cambia estado a EXPIRADA
  - [ ] `estaExpirada()` retorna true si fecha_expiracion < now
  - [ ] No se puede consolidar si estado != ACTIVA

- [ ] **MovimientoInventario Entity**
  - [ ] `crear()` genera movimiento con cantidad anterior/posterior
  - [ ] Es inmutable (no tiene métodos de mutación)

- [ ] **Value Objects**
  - [ ] `Cantidad`: no permite negativos
  - [ ] `FechaExpiracion`: calcula correctamente
  - [ ] `Version`: incrementa correctamente

- [ ] **Factories**
  - [ ] `InventarioFactory.crear()` genera ID UUID v7
  - [ ] `ReservaFactory.crear()` calcula fecha_expiracion
  - [ ] `MovimientoInventarioFactory.crear()` requiere campos obligatorios

#### 6.2. Tests de Servicios de Aplicación

**Alcance**: Lógica de orquestación (con mocks de repositorio y event bus)

- [ ] **crearInventario()**
  - [ ] Crea inventario correctamente
  - [ ] Lanza `EntidadDuplicadaError` si ya existe (tipoItem, itemId)
  - [ ] Emite evento `InventarioCreado`

- [ ] **reservarInventario()**
  - [ ] Reserva stock correctamente
  - [ ] Lanza `StockInsuficienteError` si no hay disponible
  - [ ] Lanza `OptimisticLockingError` si version cambió
  - [ ] Crea MovimientoInventario tipo RESERVA
  - [ ] Emite evento `InventarioReservado`

- [ ] **consolidarReserva()**
  - [ ] Consolida reserva ACTIVA
  - [ ] Lanza `EstadoInvalidoError` si reserva no ACTIVA
  - [ ] Crea MovimientoInventario tipo VENTA_SALIDA
  - [ ] Emite evento `InventarioDescontado`

- [ ] **liberarReservasExpiradas()**
  - [ ] Libera todas las reservas con fecha_expiracion < now
  - [ ] Restaura cantidad_disponible
  - [ ] Crea MovimientoInventario tipo LIBERACION
  - [ ] Emite evento `ReservaExpirada` por cada una

- [ ] **ajustarInventario()**
  - [ ] Ajusta cantidad correctamente (positivo y negativo)
  - [ ] Lanza `StockInsuficienteError` si ajuste negativo > disponible
  - [ ] Crea MovimientoInventario tipo AJUSTE_OPERATIVO
  - [ ] Emite evento `InventarioAjustado`

- [ ] **detectarStockBajo()**
  - [ ] Detecta inventarios con cantidad_disponible < umbral
  - [ ] Emite evento `StockBajoDetectado` por cada uno
  - [ ] No emite si ya está por debajo del umbral (idempotente)

- [ ] **consultarDisponibilidad()**
  - [ ] Retorna disponibilidad correcta
  - [ ] Retorna 0 si inventario no existe

- [ ] **eliminarInventario()**
  - [ ] Elimina (soft delete) si no tiene reservas ACTIVAS
  - [ ] Lanza `InventarioConDependenciasError` si tiene reservas activas
  - [ ] Emite evento `InventarioEliminado`

#### 6.3. Tests de Repositorio (Integración con Prisma)

**Alcance**: Persistencia real con base de datos de test

- [ ] **Setup**: Base de datos de test (SQLite o Postgres en Docker)
- [ ] **Teardown**: Limpiar DB después de cada test

- [ ] **guardar()**
  - [ ] Inserta nuevo inventario
  - [ ] Actualiza inventario existente
  - [ ] Guarda reservas nuevas en misma transacción
  - [ ] Actualiza reservas en misma transacción
  - [ ] Guarda movimientos en misma transacción
  - [ ] Lanza `OptimisticLockingError` si version no coincide
  - [ ] Rollback si falla alguna entidad

- [ ] **buscarPorId()**
  - [ ] Retorna inventario con reservas y movimientos
  - [ ] Retorna null si no existe
  - [ ] No retorna inventarios con deleted = true

- [ ] **buscarPorItem()**
  - [ ] Busca por (tipoItem, itemId) correctamente
  - [ ] Retorna null si no existe

- [ ] **buscarReservasExpiradas()**
  - [ ] Retorna solo reservas ACTIVAS con fecha_expiracion < now
  - [ ] No retorna reservas ya CONSOLIDADAS/LIBERADAS/EXPIRADAS

- [ ] **buscarInventariosBajoUmbral()**
  - [ ] Retorna inventarios con cantidad_disponible < umbral
  - [ ] Excluye inventarios eliminados

- [ ] **eliminar()**
  - [ ] Marca deleted = true (soft delete)
  - [ ] Incrementa version
  - [ ] Lanza `OptimisticLockingError` si version cambió

#### 6.4. Tests de Controllers (E2E)

**Alcance**: HTTP requests completos (con BD de test)

- [ ] **POST /inventario**
  - [ ] 201 Created con inventario creado
  - [ ] 400 Bad Request si DTO inválido
  - [ ] 409 Conflict si ya existe (tipoItem, itemId)

- [ ] **POST /inventario/reservar**
  - [ ] 201 Created con reserva creada
  - [ ] 400 Bad Request si cantidad <= 0
  - [ ] 404 Not Found si inventario no existe
  - [ ] 409 Conflict si stock insuficiente
  - [ ] 409 Conflict si optimistic locking falla

- [ ] **PATCH /inventario/consolidar**
  - [ ] 200 OK si consolidación exitosa
  - [ ] 404 Not Found si reserva no existe
  - [ ] 409 Conflict si reserva no ACTIVA

- [ ] **PATCH /inventario/ajustar**
  - [ ] 200 OK si ajuste exitoso
  - [ ] 400 Bad Request si cantidad inválida
  - [ ] 409 Conflict si stock insuficiente

- [ ] **GET /inventario/disponibilidad**
  - [ ] 200 OK con disponibilidad
  - [ ] 200 OK con disponible=0 si no existe

- [ ] **GET /inventario/item/:tipoItem/:itemId**
  - [ ] 200 OK con inventario
  - [ ] 404 Not Found si no existe

- [ ] **DELETE /inventario/:id**
  - [ ] 200 OK si eliminación exitosa
  - [ ] 404 Not Found si no existe
  - [ ] 409 Conflict si tiene dependencias

#### 6.5. Tests de Jobs

- [ ] **liberarReservasExpiradas()**
  - [ ] Corre sin errores si no hay reservas expiradas
  - [ ] Libera reservas expiradas correctamente
  - [ ] No crashea si hay error en una reserva

- [ ] **detectarStockBajo()**
  - [ ] Detecta inventarios bajo umbral
  - [ ] No crashea si hay error

#### 6.6. Configuración de Tests

- [ ] Instalar dependencias de testing

  ```bash
  npm install -D @nestjs/testing @types/jest ts-jest
  ```

- [ ] Configurar Jest para Prisma
  - [ ] Setup de base de datos de test
  - [ ] Seed de datos de prueba
  - [ ] Teardown automático

- [ ] Scripts en package.json
  ```json
  {
    "test:unit": "jest --testPathPattern=.spec.ts",
    "test:integration": "jest --testPathPattern=.integration.spec.ts",
    "test:e2e": "jest --testPathPattern=.e2e-spec.ts",
    "test:cov": "jest --coverage"
  }
  ```

#### Criterios de Aceptación (Tests)

- ✅ Coverage > 80% en domain y application
- ✅ Todos los tests pasan en CI/CD
- ✅ Tests son rápidos (suite completa < 30 segundos)
- ✅ Tests son independientes (orden no importa)
- ✅ Tests usan factories para crear datos (no datos hardcodeados)
- ✅ Tests de integración usan transacciones (rollback automático)

---

## Checklist General de Progreso

### Fase 1: Infraestructura Crítica

- [ ] 1. Jobs Automáticos
- [ ] 2. Event Bus con Redis
- [ ] 3. Logging Estructurado
- [ ] 4. Puerto a CONFIGURACION

### Fase 2: Mejoras Opcionales (Ordenadas por Prioridad)

**🟡 Prioridad Alta**

- [ ] 5.1. Índices de Performance
- [ ] 5.2. Health Check

**🟡 Prioridad Media**

- [ ] 5.3. Validación Avanzada de Input
- [ ] 5.4. Soft Delete Completo
- [ ] 5.5. Documentación Swagger Completa

**🟢 Prioridad Baja**

- [ ] 5.6. Paginación
- [ ] 5.7. README del Módulo
- [ ] 5.8. Métricas Prometheus

### Fase 3: Testing Completo

- [ ] 6.1. Tests Unitarios de Dominio
- [ ] 6.2. Tests de Servicios de Aplicación
- [ ] 6.3. Tests de Repositorio
- [ ] 6.4. Tests de Controllers (E2E)
- [ ] 6.5. Tests de Jobs
- [ ] 6.6. Configuración de Tests

---

## Estimación de Esfuerzo

| Fase | Tarea                          | Prioridad | Tiempo Estimado |
| ---- | ------------------------------ | --------- | --------------- |
| 1    | Jobs Automáticos               | 🔴        | 2 horas         |
| 1    | Event Bus con Redis            | 🔴        | 4 horas         |
| 1    | Logging Estructurado           | 🔴        | 3 horas         |
| 1    | Puerto CONFIGURACION           | 🔴        | 2 horas         |
| 2.1  | Índices de Performance         | 🟡        | 1 hora          |
| 2.2  | Health Check                   | 🟡        | 2 horas         |
| 2.3  | Validación Avanzada            | 🟡        | 2 horas         |
| 2.4  | Soft Delete Completo           | 🟡        | 2 horas         |
| 2.5  | Documentación Swagger          | 🟡        | 1.5 horas       |
| 2.6  | Paginación                     | 🟢        | 2 horas         |
| 2.7  | README del Módulo              | 🟢        | 1 hora          |
| 2.8  | Métricas Prometheus            | 🟢        | 3 horas         |
| 3    | Tests Completos                | 🔴        | 16 horas        |
|      | **TOTAL CRÍTICO (Fase 1 + 3)** |           | **27 horas**    |
|      | **TOTAL COMPLETO**             |           | **41.5 horas**  |

---

## Notas Importantes

1. **Orden es importante**: No saltar pasos, cada uno depende del anterior
2. **Commit frecuente**: Hacer commit después de cada tarea completada
3. **Testing incremental**: Aunque tests formales van al final, probar manualmente cada feature
4. **Documentación inline**: Agregar comentarios JSDoc a métodos públicos mientras se implementa
5. **Logging desde el inicio**: Agregar logs estructurados en cada nueva feature (paso 3)
6. **No sobre-optimizar**: Hacer lo mínimo viable primero, optimizar después si es necesario

---

## Criterios de DONE

Una tarea se considera completa cuando:

- ✅ El código funciona según los criterios de aceptación
- ✅ Se probó manualmente (hasta llegar a fase 3 de tests)
- ✅ Tiene logging apropiado
- ✅ Se hizo commit con mensaje descriptivo
- ✅ No rompe funcionalidad existente
- ✅ Sigue las convenciones del proyecto (hexagonal, DDD)

---

## Próximos Pasos

### Orden Recomendado de Implementación (Por Sprint)

#### Sprint 1: Infraestructura Crítica (11 horas)

1. ✅ Jobs Automáticos (2h) - EMPEZAR AQUÍ
2. ✅ Event Bus con Redis (4h)
3. ✅ Logging Estructurado (3h)
4. ✅ Puerto a CONFIGURACION (2h)

**Objetivo del Sprint**: Sistema funcional en producción con jobs corriendo

---

#### Sprint 2: Mejoras de Producción (6.5 horas)

5. ✅ Índices de Performance (1h)
6. ✅ Health Check (2h)
7. ✅ Validación Avanzada (2h)
8. ✅ Soft Delete Completo (2h) - OPCIONAL si no hay tiempo
9. ✅ Documentación Swagger (1.5h) - OPCIONAL si no hay tiempo

**Objetivo del Sprint**: Sistema robusto y monitoreable

---

#### Sprint 3: Tests (16 horas)

10. ✅ Tests Unitarios de Dominio (4h)
11. ✅ Tests de Servicios de Aplicación (4h)
12. ✅ Tests de Repositorio (3h)
13. ✅ Tests de Controllers E2E (3h)
14. ✅ Tests de Jobs (2h)

**Objetivo del Sprint**: Coverage > 80%

---

#### Sprint 4: Pulido (Opcional - 6.5 horas)

15. ✅ Paginación (2h)
16. ✅ README del Módulo (1h)
17. ✅ Métricas Prometheus (3h)
18. ✅ Cualquier pendiente de Sprint 2

**Objetivo del Sprint**: Developer Experience y Observabilidad Avanzada

---

### Mínimo Viable para Producción

**Lo ABSOLUTAMENTE necesario antes de desplegar**:

- ✅ Paso 1: Jobs Automáticos
- ✅ Paso 2: Event Bus con Redis
- ✅ Paso 3: Logging Estructurado
- ✅ Paso 5.1: Índices de Performance
- ✅ Paso 5.2: Health Check
- ✅ Paso 6: Tests (al menos unitarios y de aplicación)

**Total mínimo**: ~25 horas de trabajo

---

### Comando de Inicio

**EMPEZAR POR**: Paso 1 - Jobs Automáticos

**RAZÓN**: Es lo más crítico y con menor riesgo. Las reservas expiradas bloquean inventario y afectan directamente el negocio.

**COMANDO**:

```bash
npm install @nestjs/schedule
```

Luego modificar `inventario-jobs.service.ts` para agregar decoradores `@Cron`.

---

**Última actualización**: 30 Enero 2026  
**Responsable**: Equipo de Backend  
**Estado**: Pendiente de inicio
