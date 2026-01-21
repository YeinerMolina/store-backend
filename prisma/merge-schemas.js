#!/usr/bin/env node

/**
 * PRISMA SCHEMA MERGER
 *
 * Este script combina múltiples archivos .prisma desde prisma/schemas/
 * en un único archivo schema.prisma
 *
 * ORDEN DE PROCESAMIENTO:
 * 1. base.prisma (configuración generator + datasource)
 * 2. Todos los demás archivos en orden alfabético
 *
 * CONVENCIÓN:
 * - prisma/schemas/base.prisma: Configuración base (SIEMPRE primero)
 * - prisma/schemas/*.prisma: Schemas de módulos (orden alfabético)
 *
 * EJECUCIÓN:
 * - npm run schema:merge
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SCHEMAS_DIR = path.join(__dirname, 'schemas');
const OUTPUT_FILE = path.join(__dirname, 'schema.prisma');
const BASE_FILE = 'base.prisma';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getSchemaFiles() {
  try {
    const files = fs
      .readdirSync(SCHEMAS_DIR)
      .filter((file) => file.endsWith('.prisma'))
      .filter((file) => file !== BASE_FILE); // Excluir base.prisma para procesarlo primero

    return files.sort(); // Orden alfabético
  } catch (error) {
    log(`❌ Error leyendo directorio ${SCHEMAS_DIR}:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function readSchemaFile(filename) {
  const filePath = path.join(SCHEMAS_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`❌ Error leyendo archivo ${filename}:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function mergeSchemas() {
  log('\n🔧 Iniciando merge de schemas Prisma...', 'bright');
  log('━'.repeat(60), 'blue');

  // 1. Verificar que existe base.prisma
  const basePath = path.join(SCHEMAS_DIR, BASE_FILE);
  if (!fs.existsSync(basePath)) {
    log(`❌ Error: No se encuentra ${BASE_FILE} en ${SCHEMAS_DIR}`, 'red');
    log(`   Asegurate de que exista prisma/schemas/base.prisma`, 'yellow');
    process.exit(1);
  }

  // 2. Leer base.prisma
  log(`\n📄 Procesando configuración base...`, 'blue');
  const baseContent = readSchemaFile(BASE_FILE);
  log(`   ✓ ${BASE_FILE}`, 'green');

  // 3. Obtener archivos de módulos
  const schemaFiles = getSchemaFiles();

  if (schemaFiles.length === 0) {
    log(`\n⚠️  Advertencia: No se encontraron schemas de módulos`, 'yellow');
    log(`   Solo se generará la configuración base`, 'yellow');
  } else {
    log(`\n📦 Procesando ${schemaFiles.length} módulo(s):`, 'blue');
    schemaFiles.forEach((file) => {
      log(`   ✓ ${file}`, 'green');
    });
  }

  // 4. Combinar contenidos
  let mergedContent = '';

  // Header
  mergedContent +=
    '// ============================================================================\n';
  mergedContent += '// PRISMA SCHEMA - AUTO-GENERADO\n';
  mergedContent +=
    '// ============================================================================\n';
  mergedContent +=
    '// ⚠️  NO EDITAR DIRECTAMENTE - Este archivo se genera automáticamente\n';
  mergedContent += '//\n';
  mergedContent += '// Para modificar el schema:\n';
  mergedContent += '//   1. Editar archivos en prisma/schemas/\n';
  mergedContent += '//   2. Ejecutar: npm run schema:merge\n';
  mergedContent += '//\n';
  mergedContent += `// Generado: ${new Date().toISOString()}\n`;
  mergedContent += `// Fuentes: ${BASE_FILE}, ${schemaFiles.join(', ')}\n`;
  mergedContent +=
    '// ============================================================================\n\n';

  // Base configuration
  mergedContent += baseContent.trim() + '\n\n';

  // Module schemas
  schemaFiles.forEach((file, index) => {
    const content = readSchemaFile(file);
    mergedContent += content.trim();

    // Agregar separador entre módulos (excepto el último)
    if (index < schemaFiles.length - 1) {
      mergedContent += '\n\n';
    }
  });

  // 5. Escribir archivo combinado
  try {
    fs.writeFileSync(OUTPUT_FILE, mergedContent, 'utf8');
    log(`\n✅ Schema generado exitosamente:`, 'green');
    log(`   ${OUTPUT_FILE}`, 'bright');
  } catch (error) {
    log(`\n❌ Error escribiendo archivo schema.prisma:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // 6. Resumen
  log('\n📊 Resumen:', 'blue');
  log(`   • Archivos procesados: ${schemaFiles.length + 1}`, 'blue');
  log(`   • Líneas generadas: ${mergedContent.split('\n').length}`, 'blue');
  log(`   • Tamaño: ${(mergedContent.length / 1024).toFixed(2)} KB`, 'blue');

  log('\n━'.repeat(60), 'blue');
  log('✨ ¡Listo! Ahora podés ejecutar:', 'bright');
  log('   npm run db:generate', 'yellow');
  log('   npm run db:migrate:dev', 'yellow');
  log('', 'reset');
}

// Ejecutar
try {
  mergeSchemas();
} catch (error) {
  log('\n💥 Error inesperado:', 'red');
  log(error.stack, 'red');
  process.exit(1);
}
