import express from 'express';
import { auth } from './middleware/auth.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { usersRouter } from './routes/users.routes.ts';
import { requestsRouter } from './routes/requests.routes.ts';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.use('/api/users', usersRouter);
  app.use('/api/requests', auth, requestsRouter);

  app.use(errorHandler);

  return app;
}
