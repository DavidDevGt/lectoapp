import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../shared/errors';
import { logger } from '../config/logger';
import { ApiResponse } from '../shared/types/api-response';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Errores de validación',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, method: req.method });

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: 'Error interno del servidor',
  };
  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
  };
  res.status(404).json(response);
}
