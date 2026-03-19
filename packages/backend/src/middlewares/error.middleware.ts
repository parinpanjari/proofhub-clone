import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error:', { message: err.message, stack: err.stack });

  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    const response: ApiErrorResponse = {
      success: false,
      message: 'Validation failed',
      errors: fieldErrors,
    };
    res.status(400).json(response);
    return;
  }

  const response: ApiErrorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  };
  res.status(500).json(response);
}
