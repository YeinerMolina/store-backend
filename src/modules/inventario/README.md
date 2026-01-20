# Módulo INVENTARIO - Hexagonal Architecture

## Estructura

```
inventario/
├── domain/                     ← Núcleo del negocio (sin dependencias)
│   ├── aggregates/            ← Entidades raíz con lógica de negocio
│   ├── value-objects/         ← Objetos de valor inmutables
│   ├── ports/
│   │   ├── inbound/          ← Casos de uso (expuestos)
│   │   └── outbound/         ← Repositorios y servicios externos (necesitados)
│   └── events/               ← Eventos de dominio
├── application/               ← Orquestación de casos de uso
│   ├── services/             ← Implementan puertos inbound
│   ├── dto/                  ← Objetos de transferencia
│   └── mappers/              ← Transformaciones
└── infrastructure/            ← Adaptadores
    ├── persistence/          ← Implementación de repositorios
    ├── adapters/             ← Adaptadores a otros módulos
    └── controllers/          ← Endpoints HTTP
```

## Reglas de Dependencia

- `domain/` → NADA
- `application/` → `domain/`
- `infrastructure/` → `domain/` + `application/`

## Próximos Pasos

1. Leer `INVENTARIO_CLAUDE.md` para entender el dominio
2. Leer `INVENTARIO_ENTITIES_CLAUDE.md` para las entidades
3. Crear agregados en `domain/aggregates/`
4. Definir puertos en `domain/ports/`
5. Implementar servicios en `application/services/`
6. Crear adaptadores en `infrastructure/`
