import { Injectable, HttpStatus } from '@nestjs/common';
import {
  ApiResponse,
  ErrorDetail,
} from '../../interfaces/api-response.interface';

@Injectable()
export class ErrorResponseMapper {
  buildApiResponse(
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
}
