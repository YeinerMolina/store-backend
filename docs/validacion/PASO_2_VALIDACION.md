# Validación Manual - Paso 2: Event Bus con Redis

**Fecha**: 1 Febrero 2026  
**Implementador**: Sistema Automático  
**Estado**: ✅ COMPLETADO

---

## Checklist de Implementación

| Tarea                                  | Estado | Archivo                                                          |
| -------------------------------------- | ------ | ---------------------------------------------------------------- |
| Instalar `ioredis`                     | ✅     | `package.json`                                                   |
| Instalar `@types/ioredis`              | ✅     | `package.json` (devDependencies)                                 |
| Crear configuración de Redis           | ✅     | `src/shared/infrastructure/redis/redis.config.ts`                |
| Crear `RedisService`                   | ✅     | `src/shared/infrastructure/redis/redis.service.ts`               |
| Crear `RedisEventBusAdapter`           | ✅     | `src/shared/infrastructure/event-bus/redis-event-bus.adapter.ts` |
| Implementar método `publicar()`        | ✅     | RedisEventBusAdapter líneas 17-55                                |
| Crear módulo global `EventBusModule`   | ✅     | `src/shared/infrastructure/event-bus/event-bus.module.ts`        |
| Reemplazar adapter en InventarioModule | ✅     | `src/modules/inventario/infrastructure/inventario.module.ts`     |
| Agregar variables de Redis a .env      | ✅     | `.env` y `.env.example`                                          |
| Actualizar schema de validación        | ✅     | `src/shared/infrastructure/config/env.schema.ts`                 |

---

## Criterios de Aceptación

| Criterio                                           | Estado | Evidencia                                                |
| -------------------------------------------------- | ------ | -------------------------------------------------------- |
| Eventos se publican en Redis Pub/Sub               | ✅     | RedisEventBusAdapter línea 49: `client.publish()`        |
| Formato del mensaje es JSON válido                 | ✅     | Líneas 36-41: `JSON.stringify()` con estructura definida |
| Canal sigue convención `domain_events:{aggregate}` | ✅     | Línea 35: `domain_events:${aggregateType}`               |
| Si Redis cae, app loguea error pero no crashea     | ✅     | Try-catch líneas 18-55, solo loguea en catch             |
| Eventos incluyen metadata                          | ✅     | `eventType`, `aggregateId`, `timestamp`, `data`          |

---

## Cómo Validar Manualmente

### Prerequisito: Redis Corriendo

Elegí UNA de estas opciones:

**Opción 1: Docker (Recomendado)**

```bash
docker run -d \
  --name store-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verificar que esté corriendo
docker ps | grep store-redis
```

**Opción 2: Redis Local**

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Verificar
redis-cli ping
# Debe retornar: PONG
```

---

### Validación 1: Test de Conexión

```bash
# Ejecutar script de validación
npx ts-node scripts/test-redis-connection.ts

# Output esperado:
# 🔌 Conectando a Redis...
#    Host: localhost:6379
#    DB: 0
#
# ✅ Test 1: PING
#    Respuesta: PONG
#
# ✅ Test 2: SET/GET
#    Valor almacenado: test_value
#
# ✅ Test 3: Pub/Sub
#    📤 Evento publicado
#    📨 Mensaje recibido en domain_events:test:
#       {"eventType":"TestEvent","aggregateId":"test-123",...}
#
# 🎉 Todos los tests pasaron exitosamente!
```

---

### Validación 2: Eventos Reales del Sistema

**Terminal 1: Suscriptor Redis**

```bash
redis-cli
SUBSCRIBE domain_events:inventario
# Esperando mensajes...
```

**Terminal 2: Aplicación NestJS**

```bash
npm run start:dev

# Logs esperados:
# [REDIS] Connected successfully
# [REDIS] Ready to accept commands
# Application is running on: http://localhost:3000
```

**Terminal 3: Crear Inventario vía API**

```bash
curl -X POST http://localhost:3000/inventario \
  -H "Content-Type: application/json" \
  -d '{
    "tipoItem": "PRODUCTO",
    "itemId": "550e8400-e29b-41d4-a716-446655440000",
    "cantidadInicial": 100
  }'
```

**Verificación en Terminal 1:**

Deberías ver algo como:

```
1) "message"
2) "domain_events:inventario"
3) "{\"eventType\":\"InventarioCreado\",\"aggregateId\":\"...\",\"timestamp\":\"2026-02-01T...\",\"data\":{...}}"
```

**Logs en Terminal 2:**

```
[EVENT BUS] Published InventarioCreado to domain_events:inventario (1 subscribers)
```

---

### Validación 3: Graceful Degradation (Redis Caído)

**Paso 1: Detener Redis**

```bash
# Docker
docker stop store-redis

# Local
brew services stop redis  # macOS
sudo systemctl stop redis # Linux
```

**Paso 2: Intentar crear inventario**

```bash
curl -X POST http://localhost:3000/inventario \
  -H "Content-Type: application/json" \
  -d '{
    "tipoItem": "PRODUCTO",
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "cantidadInicial": 50
  }'
```

**Resultado esperado:**

- ✅ La creación de inventario **debe funcionar**
- ✅ Los logs deben mostrar:

  ```
  [REDIS ERROR] Connection closed
  [EVENT BUS ERROR] Connection is closed InventarioCreado
  ```

- ✅ La respuesta HTTP debe ser **201 Created** (no 500 Error)

**Paso 3: Reiniciar Redis**

```bash
# Docker
docker start store-redis

# Local
brew services start redis
sudo systemctl start redis
```

---

## Estructura de Payload de Eventos

Todos los eventos publicados siguen esta estructura:

```typescript
{
  eventType: string; // Nombre del evento (ej: "InventarioCreado")
  aggregateId: string; // UUID del agregado afectado
  timestamp: string; // ISO 8601 (ej: "2026-02-01T12:34:56.789Z")
  data: {
    // Evento completo con todos sus campos
    inventarioId: string;
    tipoItem: string;
    itemId: string;
    // ... otros campos del evento
  }
}
```

---

## Convención de Canales

Los canales de Redis Pub/Sub siguen el patrón: **`domain_events:{aggregate_type}`**

| Evento               | Canal                      |
| -------------------- | -------------------------- |
| `InventarioCreado`   | `domain_events:inventario` |
| `ReservaConsolidada` | `domain_events:reserva`    |
| `InventarioAjustado` | `domain_events:inventario` |
| `VentaConfirmada`    | `domain_events:venta`      |
| `CambioEjecutado`    | `domain_events:cambio`     |

La extracción del aggregate type se hace automáticamente quitando sufijos comunes:

```typescript
InventarioCreado     → inventario
ReservaConsolidada   → reserva
StockBajoDetectado   → stockbajo
```

---

## Configuración de Redis

### Variables de Entorno

| Variable         | Default     | Descripción             |
| ---------------- | ----------- | ----------------------- |
| `REDIS_HOST`     | `localhost` | Host del servidor Redis |
| `REDIS_PORT`     | `6379`      | Puerto de Redis         |
| `REDIS_PASSWORD` | (vacío)     | Password (opcional)     |
| `REDIS_DB`       | `0`         | Base de datos (0-15)    |

### Retry Strategy

El cliente Redis usa exponential backoff:

- **Reintentos**: Máximo 10
- **Delay**: 100ms, 200ms, 300ms, ..., hasta 3000ms
- **Timeout de conexión**: 10 segundos

---

## Troubleshooting

### Error: "ECONNREFUSED"

```
[REDIS ERROR] connect ECONNREFUSED 127.0.0.1:6379
```

**Solución**: Redis no está corriendo. Iniciá Redis con:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Error: "NOAUTH Authentication required"

```
[REDIS ERROR] NOAUTH Authentication required.
```

**Solución**: Tu Redis requiere password. Agregá a `.env`:

```
REDIS_PASSWORD=tu_password_aqui
```

### Eventos no se reciben en suscriptor

**Posibles causas**:

1. **Canal incorrecto**: Verificá que el canal sea exactamente `domain_events:{aggregate}`
2. **Timing**: El suscriptor debe estar activo ANTES de publicar
3. **DB diferente**: Suscriptor y publisher deben usar mismo `REDIS_DB`

**Debug**:

```bash
# Listar canales activos
redis-cli
PUBSUB CHANNELS

# Ver suscriptores de un canal
PUBSUB NUMSUB domain_events:inventario
```

---

## Próximos Pasos

Con el Event Bus implementado, ahora podemos:

1. ✅ **Paso 3**: Implementar Logging Estructurado (reemplazar `console.log`)
2. ✅ **Paso 4**: Conectar puerto a módulo CONFIGURACION
3. ✅ **Futuro**: Módulo AUDITORIA consumirá estos eventos para persistirlos
4. ✅ **Futuro**: Módulo COMUNICACION consumirá eventos para notificaciones

---

## Archivos Creados/Modificados

### Archivos Nuevos

- `src/shared/infrastructure/redis/redis.config.ts` - Configuración
- `src/shared/infrastructure/redis/redis.service.ts` - Cliente Redis con lifecycle
- `src/shared/infrastructure/event-bus/redis-event-bus.adapter.ts` - Implementación EventBusPort
- `src/shared/infrastructure/event-bus/event-bus.module.ts` - Módulo global
- `scripts/test-redis-connection.ts` - Script de validación
- `docs/validacion/PASO_2_VALIDACION.md` - Esta documentación

### Archivos Modificados

- `package.json` - Dependencies (ioredis, @types/ioredis)
- `src/app.module.ts` - Import EventBusModule
- `src/modules/inventario/infrastructure/inventario.module.ts` - Usa EventBusModule global
- `src/modules/inventario/domain/ports/tokens.ts` - Re-exporta EVENT_BUS_PORT_TOKEN
- `src/shared/infrastructure/config/env.schema.ts` - Validación vars Redis
- `.env` - Variables Redis
- `.env.example` - Documentación vars

---

**Paso 2 COMPLETADO**  
**Siguiente**: Paso 3 - Logging Estructurado
