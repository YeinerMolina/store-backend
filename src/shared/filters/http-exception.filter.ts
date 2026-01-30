import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { ApiResponse, ErrorDetail } from '../interfaces/api-response.interface';
import type {
  ZodValidationResponse,
  ZodValidationError,
} from '../interfaces/zod-validation.interface';

interface ExceptionInfo {
  status: HttpStatus;
  errorDetails: ErrorDetail[];
}

/**
 * Convierte excepciones del sistema en respuestas HTTP consistentes con ApiResponse.
 * Maneja tres tipos de excepciones con estrategias específicas:
 * - DomainException: errores de negocio con código y mensaje custom
 * - BadRequestException: errores de validación de Zod (múltiples errores)
 * - HttpException: errores HTTP estándar de NestJS
 * - unknown: errores no controlados (500)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorDetails } = this.extractErrorInfo(exception);
    const apiResponse = this.buildApiResponse(status, errorDetails);

    this.logException(exception, status, request);

    response.status(status).json(apiResponse);
  }

  private extractErrorInfo(exception: unknown): ExceptionInfo {
    if (exception instanceof DomainException) {
      return this.handleDomainException(exception);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    return this.handleUnknownException();
  }

  private handleDomainException(exception: DomainException): ExceptionInfo {
    return {
      status: exception.statusCode,
      errorDetails: [
        {
          code: exception.code,
          message: exception.message,
        },
      ],
    };
  }

  /**
   * ZodValidationPipe siempre lanza BadRequestException con formato específico.
   * Otras BadRequestException siguen el flujo genérico de HttpException.
   */
  private handleHttpException(exception: HttpException): ExceptionInfo {
    const status = exception.getStatus();

    if (exception instanceof BadRequestException) {
      const zodErrors = this.extractZodValidationErrors(exception);
      if (zodErrors.length > 0) {
        return { status, errorDetails: zodErrors };
      }
    }

    const exceptionResponse = exception.getResponse();
    const message = this.extractMessage(exceptionResponse);
    const code = this.mapStatusToCode(status);

    return {
      status,
      errorDetails: [{ code, message }],
    };
  }

  private handleUnknownException(): ExceptionInfo {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorDetails: [
        {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error interno del servidor',
        },
      ],
    };
  }

  private isZodValidationResponse(
    response: string | object,
  ): response is ZodValidationResponse {
    return (
      typeof response === 'object' &&
      'errores' in response &&
      Array.isArray(response.errores)
    );
  }

  private extractZodValidationErrors(
    exception: BadRequestException,
  ): ErrorDetail[] {
    const response = exception.getResponse();

    if (!this.isZodValidationResponse(response)) {
      return [];
    }

    return response.errores.map((err: ZodValidationError) => ({
      code: err.codigo,
      message: err.campo ? `${err.campo}: ${err.mensaje}` : err.mensaje,
    }));
  }

  /**
   * Prioriza 'mensaje' (español) sobre 'message' (inglés) para mantener
   * consistencia con el resto de la API.
   */
  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    const messageFields = ['mensaje', 'message'] as const;
    for (const field of messageFields) {
      if (field in exceptionResponse) {
        const value =
          exceptionResponse[field as keyof typeof exceptionResponse];
        if (typeof value === 'string') {
          return value;
        }
      }
    }

    return 'Error en la solicitud';
  }

  private mapStatusToCode(status: HttpStatus): string {
    const STATUS_CODE_MAP: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return STATUS_CODE_MAP[status] ?? 'HTTP_ERROR';
  }

  private buildApiResponse(
    status: HttpStatus,
    errorDetails: ErrorDetail[],
  ): ApiResponse<null> {
    return {
      ok: false,
      status,
      data: null,
      errors: errorDetails,
    };
  }

  private logException(
    exception: unknown,
    status: HttpStatus,
    request: Request,
  ): void {
    if (exception instanceof DomainException) {
      this.logDomainException(exception, status);
      return;
    }

    if (exception instanceof HttpException) {
      this.logHttpException(exception, status, request);
      return;
    }

    this.logUnknownException(exception);
  }

  /**
   * Excepciones de dominio >= 500 se loguean como ERROR con stack trace.
   * Resto como WARN porque son errores esperados del negocio.
   */
  private logDomainException(
    exception: DomainException,
    status: HttpStatus,
  ): void {
    const logMessage = `[${exception.code}] ${exception.message}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, exception.stack);
    } else {
      this.logger.warn(logMessage);
    }
  }

  private logHttpException(
    exception: HttpException,
    status: HttpStatus,
    request: Request,
  ): void {
    const message = this.extractMessage(exception.getResponse());
    this.logger.warn(
      `HTTP ${status} - ${request.method} ${request.url}: ${message}`,
    );
  }

  private logUnknownException(exception: unknown): void {
    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`Error no controlado: ${errorMessage}`, stack);
  }
}
