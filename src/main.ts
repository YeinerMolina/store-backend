import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { getPort, isDevelopment } from '@shared/infrastructure/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const port = getPort();

  await app.listen(port);

  logger.log(`🚀 Aplicación corriendo en puerto ${port}`);

  if (isDevelopment()) {
    logger.log('🔧 Modo desarrollo activo');
  }
}

bootstrap();
