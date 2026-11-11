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

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误，请稍后重试';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const detail = exception.getResponse();
      if (typeof detail === 'string') {
        message = detail;
      } else {
        const body = detail as ExceptionResponse;
        if (Array.isArray(body.message)) {
          message = body.message.join('；');
        } else {
          message = body.message || body.error || exception.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = '数据已存在，请勿重复提交';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = '目标数据不存在或已被删除';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = '存在关联数据，无法完成该操作';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = '数据库操作失败';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = '请求参数不合法';
    }

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.url} -> ${status}`, stack);
    }

    if (response.headersSent) {
      return;
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }
}
