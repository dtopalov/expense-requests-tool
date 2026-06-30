import type { Request, Response, NextFunction } from 'express';
import { userStore } from '../store/user.store.ts';

export function auth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'];

  if (!userId || typeof userId !== 'string') {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'X-User-Id header is required' });

    return;
  }

  const user = userStore.findById(userId);

  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: `Unknown user: ${userId}` });

    return;
  }

  res.locals['currentUser'] = user;

  next();
}
