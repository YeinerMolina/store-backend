import { Injectable, HttpStatus } from '@nestjs/common';
import {
  ExceptionHandlerStrategy,
  ExceptionInfo,
} from './exception-handler.strategy';

@Injectable()
export class UnknownExceptionHandler implements ExceptionHandlerStrategy {
  canHandle(_exception: unknown): boolean {
    return true;
  }

  handle(_exception: unknown): ExceptionInfo {
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
}
