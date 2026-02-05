# References

Full documentation for hexagonal architecture patterns used in this project.

## Architecture

- **Hexagonal Architecture Guide**: `docs/arquitectura/ARQUITECTURA_HEXAGONAL.md`
  - Complete guide: layers, dependency flow, ports/adapters, aggregates, DI, testing, mappers
- **Architecture Diagrams**: `docs/arquitectura/ARQUITECTURA_DIAGRAMA.md`
  - Visual: hexagon view, data flow (crear venta), module dependencies, DI config, testing pyramid, aggregate boundaries, model separation

## Patterns

- **Swagger Integration**: `docs/patrones/SWAGGER_INTEGRATION_GUIDE.md`
- **UUID v7**: `docs/patrones/UUID_V7_GUIDE.md`

## Reference Implementation

- **Inventario module**: `src/modules/inventario/`
  - Domain: aggregates, events, exceptions, factories, ports, value-objects
  - Application: services, DTOs with Zod schemas, mappers
  - Infrastructure: controllers, persistence (Prisma), adapters, jobs, module DI
  - Docs: Swagger decorators, examples
