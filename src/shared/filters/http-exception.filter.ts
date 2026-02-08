import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ExceptionHandlerStrategy } from './strategies/exception-handler.strategy';
import { DomainExceptionHandler } from './strategies/domain-exception.handler';
import { PrismaExceptionHandler } from './strategies/prisma-exception.handler';
import { HttpExceptionHandler } from './strategies/http-exception.handler';
import { UnknownExceptionHandler } from './strategies/unknown-exception.handler';
import { ExceptionLoggerService } from './logging/exception-logger.service';
import { ErrorResponseMapper } from './mappers/error-response.mapper';

/**
 * Convierte excepciones del sistema en respuestas HTTP consistentes con ApiResponse.
 * Usa Strategy Pattern para delegar el manejo de cada tipo de excepción.
 * El orden de las strategies determina la prioridad de evaluación.
 */
@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly strategies: ExceptionHandlerStrategy[];

  constructor(
    private readonly domainExceptionHandler: DomainExceptionHandler,
    private readonly prismaExceptionHandler: PrismaExceptionHandler,
    private readonly httpExceptionHandler: HttpExceptionHandler,
    private readonly unknownExceptionHandler: UnknownExceptionHandler,
    private readonly exceptionLogger: ExceptionLoggerService,
    private readonly errorResponseMapper: ErrorResponseMapper,
  ) {
    this.strategies = [
      this.domainExceptionHandler,
      this.prismaExceptionHandler,
      this.httpExceptionHandler,
      this.unknownExceptionHandler,
    ];
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorDetails } = this.findHandlerAndExtractInfo(exception);
    const apiResponse = this.errorResponseMapper.buildApiResponse(
      status,
      errorDetails,
    );

    this.exceptionLogger.logException(exception, status, request);

    response.status(status).json(apiResponse);
  }

  private findHandlerAndExtractInfo(exception: unknown) {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(exception)) {
        return strategy.handle(exception);
      }
    }

    return this.unknownExceptionHandler.handle(exception);
  }
}
