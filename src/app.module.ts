import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { InventarioModule } from './modules/inventario/infrastructure/inventario.module.js';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module.js';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter.js';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor.js';
import { validateEnv } from '@shared/infrastructure/config';
import { SharedModule } from './shared/shared.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    SharedModule,
    InventarioModule,
    ConfiguracionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule {}
