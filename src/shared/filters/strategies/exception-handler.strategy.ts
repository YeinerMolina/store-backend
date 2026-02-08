import { HttpStatus } from '@nestjs/common';
import { ErrorDetail } from '../../interfaces/api-response.interface';

export interface ExceptionInfo {
  status: HttpStatus;
  errorDetails: ErrorDetail[];
}

export interface ExceptionHandlerStrategy {
  canHandle(exception: unknown): boolean;
  handle(exception: unknown): ExceptionInfo;
}
