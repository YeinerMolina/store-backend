import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { DomainExceptionHandler } from './strategies/domain-exception.handler';
import { PrismaExceptionHandler } from './strategies/prisma-exception.handler';
import { HttpExceptionHandler } from './strategies/http-exception.handler';
import { UnknownExceptionHandler } from './strategies/unknown-exception.handler';
import { ExceptionLoggerService } from './logging/exception-logger.service';
import { ErrorResponseMapper } from './mappers/error-response.mapper';

/**
 * HttpExceptionFilter se exporta para que AppModule pueda registrarlo como APP_FILTER.
 * Sin este módulo, NestJS no puede resolver las dependencias del filtro (strategies, logger, mapper).
 */
@Module({
  providers: [
    HttpExceptionFilter,
    DomainExceptionHandler,
    PrismaExceptionHandler,
    HttpExceptionHandler,
    UnknownExceptionHandler,
    ExceptionLoggerService,
    ErrorResponseMapper,
  ],
  exports: [
    HttpExceptionFilter,
    DomainExceptionHandler,
    PrismaExceptionHandler,
    HttpExceptionHandler,
    UnknownExceptionHandler,
    ExceptionLoggerService,
    ErrorResponseMapper,
  ],
})
export class ExceptionFiltersModule {}
