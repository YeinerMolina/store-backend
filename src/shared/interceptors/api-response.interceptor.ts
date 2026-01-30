import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Envuelve respuestas exitosas en formato ApiResponse para consistencia.
 * Los errores son manejados por HttpExceptionFilter, no por este interceptor.
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();

        return {
          ok: true,
          status: response.statusCode,
          data,
          errors: [],
        };
      }),
    );
  }
}
