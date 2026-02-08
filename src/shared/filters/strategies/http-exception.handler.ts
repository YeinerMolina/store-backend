import { Injectable, HttpException, BadRequestException } from '@nestjs/common';
import { ErrorDetail } from '../../interfaces/api-response.interface';
import type {
  ZodValidationResponse,
  ZodValidationError,
} from '../../interfaces/zod-validation.interface';
import {
  ExceptionHandlerStrategy,
  ExceptionInfo,
} from './exception-handler.strategy';

@Injectable()
export class HttpExceptionHandler implements ExceptionHandlerStrategy {
  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  handle(exception: unknown): ExceptionInfo {
    const httpException = exception as HttpException;
    const status = httpException.getStatus();

    if (httpException instanceof BadRequestException) {
      const zodErrors = this.extractZodValidationErrors(httpException);
      if (zodErrors.length > 0) {
        return { status, errorDetails: zodErrors };
      }
    }

    const exceptionResponse = httpException.getResponse();
    const message = this.extractMessage(exceptionResponse);
    const code = this.mapStatusToCode(status);

    return {
      status,
      errorDetails: [{ code, message }],
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

  private mapStatusToCode(status: number): string {
    const STATUS_CODE_MAP: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return STATUS_CODE_MAP[status] ?? 'HTTP_ERROR';
  }
}
