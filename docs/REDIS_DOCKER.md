# Redis con Docker Compose

Este proyecto usa Redis para Event Bus (Pub/Sub) y Cache. La forma recomendada de correr Redis en desarrollo es usando Docker Compose.

## Quick Start

```bash
# Levantar Redis
docker compose up -d redis

# Verificar que está corriendo
docker compose ps

# Ver logs
docker compose logs -f redis

# Parar Redis
docker compose down
```

## Configuración

El archivo `compose.yaml` define el servicio de Redis con:

- **Imagen**: `redis:7-alpine` (versión estable y liviana)
- **Puerto**: `6379` (expuesto en localhost)
- **Volumen**: `redis-data` (persistencia de datos)
- **Healthcheck**: Verifica disponibilidad con `redis-cli ping`
- **Red**: `store-network` (red interna de Docker)

## Variables de Entorno

En tu archivo `.env`:

```env
# Si corres la app EN Docker (mismo compose)
REDIS_HOST=redis
REDIS_PORT=6379

# Si corres la app FUERA de Docker
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Verificar Conexión

El proyecto incluye un script de validación:

```bash
# Asegurate que Redis esté corriendo primero
docker compose up -d redis

# Ejecuta el test
npx ts-node scripts/test-redis-connection.ts
```

Deberías ver:

```
✅ Conexión exitosa
✅ Pub/Sub funcionando
📊 Estadísticas de Redis
```

## Comandos Útiles

```bash
# Ejecutar redis-cli dentro del contenedor
docker compose exec redis redis-cli

# Limpiar todos los datos
docker compose exec redis redis-cli FLUSHALL

# Reiniciar Redis (mantiene datos en volumen)
docker compose restart redis

# Eliminar Redis Y el volumen (borra todos los datos)
docker compose down -v
```

## Troubleshooting

### Redis no inicia

```bash
# Ver logs detallados
docker compose logs redis

# Verificar que el puerto 6379 no esté ocupado
lsof -i :6379
# o en Linux:
ss -tulpn | grep 6379
```

### La app no se conecta a Redis

1. Verifica que Redis esté corriendo: `docker compose ps`
2. Verifica la variable `REDIS_HOST` en tu `.env`:
   - Si la app corre en Docker: usa `redis`
   - Si la app corre local: usa `localhost`
3. Chequea los logs de Redis: `docker compose logs redis`

### Limpiar y empezar de cero

```bash
# Parar y eliminar todo (contenedor + volumen)
docker compose down -v

# Levantar nuevamente
docker compose up -d redis
```

## Redis en Producción

Para producción, considera:

1. **Habilitar autenticación**: Agrega `REDIS_PASSWORD` en `.env`
2. **Redis Cluster**: Para alta disponibilidad
3. **Backups**: Configurar persistencia RDB/AOF
4. **Monitoreo**: Integrar con Prometheus/Grafana
5. **Managed Service**: AWS ElastiCache, Redis Enterprise, etc.

## Referencias

- [Redis Official Docker Image](https://hub.docker.com/_/redis)
- [Redis Documentation](https://redis.io/docs/)
- [ioredis (Node.js Client)](https://github.com/redis/ioredis)
