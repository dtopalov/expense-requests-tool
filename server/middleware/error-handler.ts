import type { Request, Response, NextFunction } from 'express';
import { ServiceError } from '../services/request.service.ts';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ServiceError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {})
    });

    return;
  }

  console.error(err);

  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
}
