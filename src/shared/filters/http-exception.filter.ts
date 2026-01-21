import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';
import { DomainException } from '../exceptions/domain.exception';

/**
 * Filtro global que captura todas las excepciones y las transforma
 * a la estructura estándar ApiResponse
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const apiResponse = this.buildApiResponse(exception);

    // Log del error (solo en desarrollo o para errores 5xx)
    if (apiResponse.status >= 500) {
      this.logger.error(
        `Error interno del servidor: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(apiResponse.status).json(apiResponse);
  }

  private buildApiResponse(exception: unknown): ApiResponse {
    // 1. Excepciones de dominio (DomainException)
    if (exception instanceof DomainException) {
      return {
        ok: false,
        status: exception.statusCode,
        data: null,
        errors: [
          {
            message: exception.message,
            code: exception.code,
          },
        ],
      };
    }

    // 2. Excepciones HTTP de NestJS (HttpException)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Si la respuesta tiene estructura conocida
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as any;

        // Validación de Nest (class-validator)
        if (Array.isArray(response.message)) {
          return {
            ok: false,
            status,
            data: null,
            errors: response.message.map((msg: string) => ({
              message: msg,
              code: 'VALIDATION_ERROR',
            })),
          };
        }

        // Otros casos de HttpException
        return {
          ok: false,
          status,
          data: null,
          errors: [
            {
              message: response.message || exception.message,
              code: this.getErrorCodeFromStatus(status),
            },
          ],
        };
      }

      // Respuesta simple de HttpException
      return {
        ok: false,
        status,
        data: null,
        errors: [
          {
            message: exception.message,
            code: this.getErrorCodeFromStatus(status),
          },
        ],
      };
    }

    // 3. Errores genéricos (Error)
    if (exception instanceof Error) {
      return {
        ok: false,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        errors: [
          {
            message:
              process.env.NODE_ENV === 'production'
                ? 'Error interno del servidor'
                : exception.message,
            code: 'INTERNAL_SERVER_ERROR',
          },
        ],
      };
    }

    // 4. Excepciones desconocidas
    return {
      ok: false,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      data: null,
      errors: [
        {
          message: 'Error desconocido',
          code: 'UNKNOWN_ERROR',
        },
      ],
    };
  }

  /**
   * Mapea códigos de estado HTTP a códigos de error
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] || 'HTTP_ERROR';
  }
}
