import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../exceptions/domain.exception';

@Injectable()
export class ExceptionLoggerService {
  private readonly logger = new Logger(ExceptionLoggerService.name);

  logException(exception: unknown, status: HttpStatus, request: Request): void {
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
}
