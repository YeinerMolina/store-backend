#!/bin/bash

# Script para crear la estructura hexagonal de un módulo
# Uso: ./scripts/create-hexagonal-module.sh nombre-modulo

if [ -z "$1" ]; then
  echo "Error: Debes proporcionar el nombre del módulo"
  echo "Uso: ./scripts/create-hexagonal-module.sh nombre-modulo"
  exit 1
fi

MODULE_NAME=$1
BASE_PATH="src/modules/$MODULE_NAME"

echo "📦 Creando estructura hexagonal para módulo: $MODULE_NAME"

# Crear estructura de directorios
mkdir -p "$BASE_PATH/domain/aggregates"
mkdir -p "$BASE_PATH/domain/value-objects"
mkdir -p "$BASE_PATH/domain/ports/inbound"
mkdir -p "$BASE_PATH/domain/ports/outbound"
mkdir -p "$BASE_PATH/domain/events"
mkdir -p "$BASE_PATH/application/services"
mkdir -p "$BASE_PATH/application/dto"
mkdir -p "$BASE_PATH/application/mappers"
mkdir -p "$BASE_PATH/infrastructure/persistence/mappers"
mkdir -p "$BASE_PATH/infrastructure/adapters"
mkdir -p "$BASE_PATH/infrastructure/controllers"

echo "✅ Estructura de directorios creada"

# Crear archivo .gitkeep para mantener carpetas vacías
find "$BASE_PATH" -type d -empty -exec touch {}/.gitkeep \;

echo "✅ Archivos .gitkeep creados"

# Crear README del módulo
cat > "$BASE_PATH/README.md" << EOF
# Módulo ${MODULE_NAME^^} - Hexagonal Architecture

## Estructura

\`\`\`
$MODULE_NAME/
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
\`\`\`

## Reglas de Dependencia

- \`domain/\` → NADA
- \`application/\` → \`domain/\`
- \`infrastructure/\` → \`domain/\` + \`application/\`

## Próximos Pasos

1. Leer \`${MODULE_NAME^^}_CLAUDE.md\` para entender el dominio
2. Leer \`${MODULE_NAME^^}_ENTITIES_CLAUDE.md\` para las entidades
3. Crear agregados en \`domain/aggregates/\`
4. Definir puertos en \`domain/ports/\`
5. Implementar servicios en \`application/services/\`
6. Crear adaptadores en \`infrastructure/\`
EOF

echo "✅ README creado"
echo ""
echo "🎉 Módulo $MODULE_NAME creado exitosamente en $BASE_PATH"
echo ""
echo "📖 Próximos pasos:"
echo "   1. Lee ${MODULE_NAME^^}_CLAUDE.md para entender el dominio"
echo "   2. Lee ${MODULE_NAME^^}_ENTITIES_CLAUDE.md para las entidades"
echo "   3. Implementa los agregados en domain/aggregates/"
echo "   4. Define los puertos en domain/ports/"
echo "   5. Implementa los servicios en application/services/"
