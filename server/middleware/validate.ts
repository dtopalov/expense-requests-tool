import type { Request, Response, NextFunction } from 'express';

export function requireBody(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Request body is required' });

    return;
  }

  next();
}
