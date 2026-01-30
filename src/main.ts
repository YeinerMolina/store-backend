import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import {
  getPort,
  isDevelopment,
  setupSwagger,
} from '@shared/infrastructure/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = getPort();

  setupSwagger(app);

  await app.listen(port);

  logger.log(`🚀 Aplicación corriendo en puerto ${port}`);

  if (isDevelopment()) {
    logger.log('🔧 Modo desarrollo activo');
    logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
