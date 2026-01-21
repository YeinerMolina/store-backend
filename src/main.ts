import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter - maneja todos los errores
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor - envuelve respuestas exitosas
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
