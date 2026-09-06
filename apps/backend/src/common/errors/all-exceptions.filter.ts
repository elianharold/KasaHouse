import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import type { ApiErrorBody } from '@kasahouse/shared-types';
import { DomainException } from './domain.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.toErrorBody(exception, request.originalUrl);

    if (body.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${body.statusCode} ${body.error}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.originalUrl} -> ${body.statusCode} ${body.error}: ${body.message}`,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown, path: string): ApiErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof DomainException) {
      const res = exception.getResponse() as { code: string; message: string };
      return {
        statusCode: exception.getStatus(),
        error: res.code,
        message: res.message,
        fieldErrors: (exception.meta?.fieldErrors as Record<string, string[]>) ?? undefined,
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      const flatMessage = Array.isArray(message) ? message.join('; ') : message;
      return {
        statusCode: status,
        error: this.nameForStatus(status),
        message: flatMessage,
        fieldErrors: Array.isArray(message) ? { _: message } : undefined,
        path,
        timestamp,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'DUPLICATE',
          message: 'A record with these details already exists.',
          path,
          timestamp,
        };
      }
      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'NOT_FOUND',
          message: 'The requested record was not found.',
          path,
          timestamp,
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again.',
      path,
      timestamp,
    };
  }

  private nameForStatus(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMITED';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'ERROR';
    }
  }
}
