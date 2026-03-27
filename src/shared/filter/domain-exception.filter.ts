import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../domain/task/exception/domain-exception.base';

// WHY @Catch(DomainException)?
// This tells NestJS: "whenever a DomainException (or any subclass of it)
// is thrown anywhere in the app, send it here instead of crashing."
//
// Every specific exception (TaskNotFoundException, DuplicateTitleException)
// extends DomainException — so they are ALL caught here automatically.
// You never write try/catch in controllers.

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // WHY map errorCode to HTTP status?
    // HTTP status codes are a presentation concern — they belong here,
    // not in the domain. The domain just says "NOT_FOUND" —
    // the filter decides that means 404.
    const status = this.getHttpStatus(exception.errorCode);

    response.status(status).json({
      statusCode: status,
      errorCode: exception.errorCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatus(errorCode: string): number {
    // WHY a map instead of if/else?
    // Easier to read and extend — just add a new line for new codes.
    const statusMap: Record<string, number> = {
      TASK_NOT_FOUND: HttpStatus.NOT_FOUND,
      PROJECT_NOT_FOUND: HttpStatus.NOT_FOUND,
      DUPLICATE_TASK_TITLE: HttpStatus.CONFLICT,
      DUPLICATE_PROJECT_NAME: HttpStatus.CONFLICT,
      INVALID_SCORE_POINTS: HttpStatus.BAD_REQUEST,
      TASK_ALREADY_COMPLETED: HttpStatus.BAD_REQUEST,
      INVALID_RECURRENCE_INTERVAL: HttpStatus.BAD_REQUEST,
    };

    // Default to 400 if we somehow get an unmapped error code
    return statusMap[errorCode] ?? HttpStatus.BAD_REQUEST;
  }
}
