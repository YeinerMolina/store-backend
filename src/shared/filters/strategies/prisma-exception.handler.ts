import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ExceptionHandlerStrategy,
  ExceptionInfo,
} from './exception-handler.strategy';

@Injectable()
export class PrismaExceptionHandler implements ExceptionHandlerStrategy {
  private readonly logger = new Logger(PrismaExceptionHandler.name);

  canHandle(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      (typeof exception === 'object' &&
        exception !== null &&
        'code' in exception &&
        typeof exception.code === 'string' &&
        exception.code.startsWith('P'))
    );
  }

  handle(exception: unknown): ExceptionInfo {
    const prismaException = exception as Prisma.PrismaClientKnownRequestError;

    switch (prismaException.code) {
      case 'P2002':
        return this.handleUniqueConstraintViolation(prismaException);
      case 'P2003':
        return this.handleForeignKeyViolation(prismaException);
      case 'P2025':
        return this.handleRecordNotFound();
      default:
        return this.handleUnknownPrismaError(prismaException);
    }
  }

  private handleUniqueConstraintViolation(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ExceptionInfo {
    const target = exception.meta?.target;
    const fields = Array.isArray(target) ? target.join(', ') : target;
    const message = fields
      ? `Ya existe un registro con ${fields} duplicado`
      : 'Ya existe un registro con estos valores';

    return {
      status: HttpStatus.CONFLICT,
      errorDetails: [
        {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message,
        },
      ],
    };
  }

  private handleForeignKeyViolation(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ExceptionInfo {
    const fieldName = exception.meta?.field_name;
    const message = fieldName
      ? `La referencia a ${fieldName} no existe`
      : 'Referencia a registro inexistente';

    return {
      status: HttpStatus.BAD_REQUEST,
      errorDetails: [
        {
          code: 'FOREIGN_KEY_VIOLATION',
          message,
        },
      ],
    };
  }

  private handleRecordNotFound(): ExceptionInfo {
    return {
      status: HttpStatus.NOT_FOUND,
      errorDetails: [
        {
          code: 'RECORD_NOT_FOUND',
          message: 'Registro no encontrado',
        },
      ],
    };
  }

  private handleUnknownPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ExceptionInfo {
    this.logger.error(
      `Error Prisma no manejado: ${exception.code}`,
      exception.stack,
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorDetails: [
        {
          code: 'DATABASE_ERROR',
          message: 'Error al interactuar con la base de datos',
        },
      ],
    };
  }
}
