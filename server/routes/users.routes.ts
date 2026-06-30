import { Router } from 'express';
import type { Request, Response } from 'express';
import { userStore } from '../store/user.store.ts';
import type { User } from '../models/user.model.ts';

export const usersRouter = Router();

usersRouter.get('/', (_req: Request, res: Response) => {
  res.json(userStore.findAll());
});

usersRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params['id'] ?? '');
  const user: User | undefined = userStore.findById(id);

  if (!user) {
    res.status(404).json({ error: 'NOT_FOUND', message: `User ${id} not found` });

    return;
  }

  res.json(user);
});
