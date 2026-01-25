# 🏪 Store Backend - Tienda Retail v2.1

Backend para tienda retail de productos de vestir con operaciones físicas y digitales.

**Arquitectura**: Domain-Driven Design (DDD) + Hexagonal Architecture (Ports & Adapters)  
**Stack**: NestJS, TypeScript, Prisma, PostgreSQL, Redis  
**Versión del Dominio**: 2.1

---

## 📚 Documentación Principal

**IMPORTANTE:** Lee estos documentos en orden antes de empezar:

| Documento                                                                      | Descripción                      | Tiempo |
| ------------------------------------------------------------------------------ | -------------------------------- | ------ |
| **[CLAUDE.md](./CLAUDE.md)**                                                   | 📖 Visión general del sistema    | 10 min |
| **[ARQUITECTURA_HEXAGONAL.md](./docs/arquitectura/ARQUITECTURA_HEXAGONAL.md)** | 🏗️ Guía completa de arquitectura | 20 min |
| **[ARQUITECTURA_DIAGRAMA.md](./docs/arquitectura/ARQUITECTURA_DIAGRAMA.md)**   | 🎨 Diagramas visuales            | 10 min |

---

## 🎯 Características del Sistema

### Core v1.0

- ✅ Ventas multicanal (física y digital)
- ✅ Gestión de inventario con reservas temporales
- ✅ Sistema de cambios controlados con diferencia de precio
- ✅ Envíos externos con tracking
- ✅ Documentación fiscal (facturas, notas de crédito/débito)
- ✅ Gestión de terceros con roles múltiples

### Nuevas Funcionalidades v2.1

- 🆕 **Carrito**: Estado pre-transaccional sin reserva de inventario
- 🆕 **Lista de Deseos**: Múltiples listas personalizadas por cliente
- 🆕 **Notificaciones**: Sistema transversal in-app con preferencias configurables
- 🆕 **Cliente con Cuenta**: Diferenciación entre clientes CON_CUENTA y SIN_CUENTA

---

## 🏗️ Arquitectura

Este proyecto implementa **Arquitectura Hexagonal** combinada con **DDD**.

### Estructura de un Módulo

```
{modulo}/
├── domain/                     ← Núcleo (sin dependencias)
│   ├── aggregates/            ← Entidades raíz + lógica de negocio
│   ├── value-objects/         ← Objetos de valor inmutables
│   ├── ports/
│   │   ├── inbound/          ← Casos de uso (expuestos)
│   │   └── outbound/         ← Dependencias externas (necesitadas)
│   └── events/               ← Eventos de dominio
├── application/               ← Orquestación
│   ├── services/             ← Implementación de casos de uso
│   ├── dto/                  ← Data Transfer Objects
│   └── mappers/              ← Transformaciones
└── infrastructure/            ← Adaptadores
    ├── persistence/          ← Repositorios (Prisma)
    ├── adapters/             ← Adaptadores a otros módulos
    └── controllers/          ← Endpoints HTTP (NestJS)
```

### Módulos del Sistema (11 Bounded Contexts)

| Módulo            | Estado             | Descripción                             |
| ----------------- | ------------------ | --------------------------------------- |
| **COMERCIAL**     | ✅ Implementado    | Ventas y cambios (módulo de referencia) |
| **IDENTIDAD**     | 📋 Por implementar | Terceros (personas/empresas)            |
| **CATALOGO**      | 📋 Por implementar | Productos y paquetes                    |
| **INVENTARIO**    | 📋 Por implementar | Stock, reservas, movimientos            |
| **PRE_VENTA**     | 📋 Por implementar | Carrito y listas de deseos              |
| **LOGISTICA**     | 📋 Por implementar | Envíos y entregas                       |
| **FISCAL**        | 📋 Por implementar | Documentación tributaria                |
| **COMUNICACION**  | 📋 Por implementar | Notificaciones                          |
| **CONFIGURACION** | 📋 Por implementar | Parámetros del sistema                  |
| **SEGURIDAD**     | 📋 Por implementar | Perfiles y permisos                     |
| **AUDITORIA**     | 📋 Por implementar | Eventos de dominio                      |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- PostgreSQL 16+
- Redis 7+
- npm o yarn

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd store-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Configurar Prisma (cuando esté listo)
npx prisma migrate dev
npx prisma generate

# 5. Ejecutar en desarrollo
npm run start:dev
```

### Explorar el Código

```bash
# Ver módulo de ejemplo (COMERCIAL)
ls src/modules/comercial/

# Ver documentación de un módulo
cat src/modules/comercial/COMERCIAL_CLAUDE.md
cat src/modules/comercial/COMERCIAL_ENTITIES_CLAUDE.md

# Ver estructura de todos los módulos
tree src/modules/ -L 2
```

---

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo watch
npm run start:debug        # Con debugger

# Producción
npm run build              # Compilar
npm run start:prod         # Ejecutar compilado

# Testing
npm run test               # Unit tests
npm run test:watch         # Unit tests en watch
npm run test:cov           # Con coverage
npm run test:e2e           # E2E tests

# Linting
npm run lint               # ESLint
npm run format             # Prettier

# Prisma
npx prisma migrate dev     # Crear migración
npx prisma generate        # Generar cliente
npx prisma studio          # UI para explorar BD
```

---

## 🧪 Testing

El proyecto sigue la pirámide de testing hexagonal:

### Unit Tests (Dominio)

```typescript
// SIN mocks - Lógica pura
describe('Venta Aggregate', () => {
  it('debe confirmar venta en borrador', () => {
    const venta = Venta.crear({ ... });
    venta.confirmar();
    expect(venta.getEstado()).toBe(EstadoVenta.CONFIRMADA);
  });
});
```

### Integration Tests (Application)

```typescript
// CON mocks de puertos (interfaces)
describe('VentaService', () => {
  it('debe crear venta', async () => {
    const mockRepo = { save: jest.fn() };
    const service = new VentaService(mockRepo, ...);
    await service.crearDesdeCarrito(...);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### E2E Tests

```typescript
// Infraestructura real
it('POST /ventas debe crear venta', async () => {
  const response = await request(app)
    .post('/ventas')
    .send({ ... });
  expect(response.status).toBe(201);
});
```

---

## 📖 Guías y Convenciones

### Para Desarrolladores Nuevos

1. Lee **[QUICKSTART.md](./QUICKSTART.md)** (5 min)
2. Lee **[ARQUITECTURA_HEXAGONAL.md](./docs/arquitectura/ARQUITECTURA_HEXAGONAL.md)** (20 min)
3. Explora `src/modules/comercial/` como ejemplo
4. Consulta **[ARQUITECTURA_DIAGRAMA.md](./docs/arquitectura/ARQUITECTURA_DIAGRAMA.md)** para visualizaciones

### Para Implementar un Módulo Nuevo

1. Lee `{MODULO}_CLAUDE.md` (lógica de negocio)
2. Lee `{MODULO}_ENTITIES_CLAUDE.md` (entidades)
3. La estructura ya está creada (domain, application, infrastructure)
4. Sigue el orden: agregados → puertos → servicios → adaptadores

### Reglas de Dependencia

```
✅ PERMITIDO:
  domain/        → NADA
  application/   → domain/
  infrastructure → domain/ + application/

❌ PROHIBIDO:
  domain/        → application/  ❌
  domain/        → infrastructure/ ❌
  application/   → infrastructure/ ❌
```

---

## 🛠️ Stack Tecnológico

| Categoría         | Tecnología      | Versión |
| ----------------- | --------------- | ------- |
| **Framework**     | NestJS          | 11.x    |
| **Lenguaje**      | TypeScript      | 5.x     |
| **Base de Datos** | PostgreSQL      | 16+     |
| **ORM**           | Prisma          | 5+      |
| **Cache**         | Redis           | 7+      |
| **Autenticación** | JWT             | -       |
| **Testing**       | Jest            | 30.x    |
| **Validación**    | class-validator | -       |

---

## 📁 Estructura del Proyecto

```
store-backend/
├── src/
│   ├── shared/                  # Código compartido
│   │   ├── domain/
│   │   └── infrastructure/
│   └── modules/                 # 11 bounded contexts
│       ├── comercial/           # ✅ Ejemplo completo
│       ├── identidad/
│       ├── catalogo/
│       ├── inventario/
│       ├── pre-venta/
│       ├── logistica/
│       ├── fiscal/
│       ├── comunicacion/
│       ├── configuracion/
│       ├── seguridad/
│       └── auditoria/
│
├── prisma/                      # Esquemas de BD
├── test/                        # E2E tests
├── scripts/                     # Scripts utilitarios
│
├── QUICKSTART.md                # ⚡ Inicio rápido
├── CLAUDE.md                    # 📖 Visión general
├── docs/                         # 📚 Documentación del proyecto
│   ├── arquitectura/            # 🏗️ Guías de arquitectura
│   │   ├── ARQUITECTURA_HEXAGONAL.md
│   │   └── ARQUITECTURA_DIAGRAMA.md
│   ├── persistencia/            # 💾 Diseño de persistencia
│   │   └── diseno_persistencia_backend_v2.md
│   └── patrones/                # 🔧 Patrones y convenciones técnicas
│       ├── UUID_V7_GUIDE.md
│       ├── PIPES_VALIDACION.md
│       └── VALIDACION_SCHEMAS.md
└── README.md                    # Este archivo
```

---

## 🤝 Contribuir

### Workflow

1. Crear branch: `git checkout -b feature/nombre-feature`
2. Implementar siguiendo arquitectura hexagonal
3. Escribir tests (unitarios + integración + e2e)
4. Commit: `git commit -m "feat: descripción"`
5. Push: `git push origin feature/nombre-feature`
6. Crear Pull Request

### Convenciones de Código

- **Nomenclatura BD**: snake_case (tablas, columnas)
- **Nomenclatura TypeScript**: camelCase (variables), PascalCase (clases)
- **Enums**: UPPER_SNAKE_CASE
- **IDs**: UUID v4

---

## 📞 Contacto y Soporte

- **Documentación**: Ver archivos `.md` en carpeta `docs/`
- **Issues**: Usar GitHub Issues
- **Preguntas**: Consultar `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md` primero

---

## 📄 Licencia

[Especificar licencia]

---

## 🎓 Recursos Adicionales

- [NestJS Documentation](https://docs.nestjs.com)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Versión del Dominio**: 2.1  
**Última Actualización**: Enero 2026
