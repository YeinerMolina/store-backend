import { Injectable } from '@nestjs/common';
import { DomainException } from '../../exceptions/domain.exception';
import {
  ExceptionHandlerStrategy,
  ExceptionInfo,
} from './exception-handler.strategy';

@Injectable()
export class DomainExceptionHandler implements ExceptionHandlerStrategy {
  canHandle(exception: unknown): boolean {
    return exception instanceof DomainException;
  }

  handle(exception: unknown): ExceptionInfo {
    const domainException = exception as DomainException;

    return {
      status: domainException.statusCode,
      errorDetails: [
        {
          code: domainException.code,
          message: domainException.message,
        },
      ],
    };
  }
}
