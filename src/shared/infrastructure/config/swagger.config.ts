import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isDevelopment } from './env.helpers.js';

/**
 * Configura Swagger UI solo en desarrollo.
 * En producción retorna inmediatamente sin crear documentación.
 */
export const setupSwagger = (app: INestApplication): void => {
  if (!isDevelopment()) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Store Backend API')
    .setDescription(
      'API REST para sistema de tienda retail con arquitectura hexagonal y DDD',
    )
    .setVersion('2.1.0')
    .addTag('Inventario', 'Gestión de stock, reservas y movimientos')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
};
