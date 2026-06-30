import { Router } from 'express';
import type { Request, Response } from 'express';
import type { User } from '../models/user.model.ts';
import {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  submitRequest,
  approveRequest,
  rejectRequest,
  resubmitRequest
} from '../services/request.service.ts';
import { requireBody } from '../middleware/validate.ts';

export const requestsRouter = Router();

function currentUser(res: Response): User {
  return res.locals['currentUser'] as User;
}

function paramId(req: Request): string {
  return String(req.params['id'] ?? '');
}

requestsRouter.get('/', (req: Request, res: Response) => {
  const { status, search, requesterId, minAmountCents, maxAmountCents, sortKey, sortDir } =
    req.query;

  function parseIntParam(val: unknown): number | undefined {
    if (typeof val !== 'string') return undefined;
    const n = parseInt(val, 10);
    return isNaN(n) || n < 0 ? undefined : n;
  }

  function parseSortDir(val: unknown): 'asc' | 'desc' | undefined {
    return val === 'asc' || val === 'desc' ? val : undefined;
  }

  const results = listRequests({
    status: typeof status === 'string' ? status : undefined,
    search: typeof search === 'string' ? search : undefined,
    requesterId: typeof requesterId === 'string' ? requesterId : undefined,
    minAmountCents: parseIntParam(minAmountCents),
    maxAmountCents: parseIntParam(maxAmountCents),
    sortKey: typeof sortKey === 'string' ? sortKey : undefined,
    sortDir: parseSortDir(sortDir)
  });

  res.json(results);
});

requestsRouter.get('/:id', (req: Request, res: Response) => {
  const result = getRequest(paramId(req));

  res.json(result);
});

requestsRouter.post('/', requireBody, (req: Request, res: Response) => {
  const result = createRequest(currentUser(res), req.body);

  res.status(201).json(result);
});

requestsRouter.patch('/:id', requireBody, (req: Request, res: Response) => {
  const result = updateRequest(paramId(req), currentUser(res), req.body);

  res.json(result);
});

requestsRouter.post('/:id/submit', (req: Request, res: Response) => {
  const result = submitRequest(paramId(req), currentUser(res));

  res.json(result);
});

requestsRouter.post('/:id/approve', (req: Request, res: Response) => {
  const { comment } = (req.body ?? {}) as { comment?: string };
  const result = approveRequest(paramId(req), currentUser(res), comment);

  res.json(result);
});

requestsRouter.post('/:id/reject', requireBody, (req: Request, res: Response) => {
  const { comment } = req.body as { comment?: string };
  const result = rejectRequest(paramId(req), currentUser(res), comment);

  res.json(result);
});

requestsRouter.post('/:id/resubmit', requireBody, (req: Request, res: Response) => {
  const body = req.body as { values?: unknown; note?: string };
  const result = resubmitRequest(paramId(req), currentUser(res), body.values, body.note);

  res.json(result);
});
