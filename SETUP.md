# Setup Inicial

## Requisitos
- Node.js 20+ (recomendado 22)
- PostgreSQL 14+
- npm o yarn

## Pasos

### 1. Clonar y dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus valores
```

### 3. Crear base de datos
```bash
createdb store_db
# O en psql:
CREATE DATABASE store_db;
```

### 4. Ejecutar migrations (próximo paso)
```bash
npm run migration:run
```

### 5. Ejecutar en desarrollo
```bash
npm run start:dev
```

La API estará en `http://localhost:3000`

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:cov
```

## Build para producción
```bash
npm run build
npm run start:prod
```

---

## Estructura del Proyecto

Leé `ARCHITECTURE.md` para entender la arquitectura en detalle.

**Tl;DR**: Cada módulo tiene:
- `domain/` → Lógica de negocio (pura)
- `application/` → Use cases y orquestación
- `infrastructure/` → Detalles técnicos (BD, APIs externas)
- `presentation/` → Controllers y DTOs

