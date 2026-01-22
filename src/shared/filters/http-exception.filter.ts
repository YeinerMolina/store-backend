import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Filtro global de excepciones HTTP y de dominio
 * Convierte excepciones en respuestas HTTP consistentes
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: HttpStatus;
    let errorResponse: any;

    if (exception instanceof DomainException) {
      // Excepciones de dominio: usar statusCode de la excepción
      status = exception.statusCode;
      errorResponse = {
        codigo: exception.code,
        mensaje: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      // Log nivel según severidad
      if (status >= 500) {
        this.logger.error(
          `[${exception.code}] ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(`[${exception.code}] ${exception.message}`);
      }
    } else if (exception instanceof HttpException) {
      // Excepciones HTTP de NestJS
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        codigo:
          typeof exceptionResponse === 'object' && 'codigo' in exceptionResponse
            ? exceptionResponse['codigo']
            : 'HTTP_ERROR',
        mensaje:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse['message'] || exception.message,
        errores:
          typeof exceptionResponse === 'object' &&
          'errores' in exceptionResponse
            ? exceptionResponse['errores']
            : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.warn(
        `HTTP ${status} - ${request.method} ${request.url}: ${errorResponse.mensaje}`,
      );
    } else {
      // Errores no controlados
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        codigo: 'INTERNAL_SERVER_ERROR',
        mensaje: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.error(
        `Error no controlado: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(errorResponse);
  }
}
