import type { User } from '../models/user.model.ts';
import type {
  ExpenseRequest,
  ExpenseRequestWithStatus
} from '../models/request.model.ts';
import {
  withStatus,
  deriveStatus,
  deriveApprovalProgress,
  sanitizeValues
} from '../models/request.model.ts';
import { validateRequestValues, hasErrors } from '../models/validation.ts';
import { resolveApprovalChain, RoutingError } from './routing.service.ts';
import { requestStore } from '../store/request.store.ts';
import { userStore } from '../store/user.store.ts';

export class ServiceError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(statusCode: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

export type ListQuery = {
  status?: string;
  search?: string;
  requesterId?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
};

export function listRequests(query: ListQuery): ExpenseRequestWithStatus[] {
  let results = requestStore.findAll().map(withStatus);

  if (query.status) {
    results = results.filter(r => r.status === query.status);
  }

  if (query.requesterId) {
    results = results.filter(r => r.requesterId === query.requesterId);
  }

  if (query.search) {
    const q = query.search.toLowerCase();

    results = results.filter(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.values.description?.toLowerCase().includes(q) ||
        r.values.expenseType?.toLowerCase().includes(q)
    );
  }

  if (query.minAmountCents !== undefined) {
    results = results.filter(r => (r.values.amountCents ?? 0) >= query.minAmountCents!);
  }

  if (query.maxAmountCents !== undefined) {
    results = results.filter(r => (r.values.amountCents ?? 0) <= query.maxAmountCents!);
  }

  if (query.sortKey && query.sortDir) {
    const { sortKey, sortDir } = query;

    results = [...results].sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      switch (sortKey) {
        case 'id':
          av = a.id; bv = b.id; break;
        case 'expenseType':
          av = a.values.expenseType ?? ''; bv = b.values.expenseType ?? ''; break;
        case 'amountCents':
          av = a.values.amountCents ?? 0; bv = b.values.amountCents ?? 0; break;
        case 'description':
          av = a.values.description ?? ''; bv = b.values.description ?? ''; break;
        case 'status':
          av = a.status; bv = b.status; break;
        default:
          return 0;
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return results;
}

export function getRequest(id: string): ExpenseRequestWithStatus {
  const req = requestStore.findById(id);

  if (!req) throw new ServiceError(404, 'NOT_FOUND', `Request ${id} not found`);

  return withStatus(req);
}

export function createRequest(requester: User, values: unknown): ExpenseRequestWithStatus {
  const req = requestStore.create(requester.id, sanitizeValues(values));

  return withStatus(req);
}

export function updateRequest(
  id: string,
  actor: User,
  values: unknown
): ExpenseRequestWithStatus {
  const req = requestStore.findById(id);

  if (!req) throw new ServiceError(404, 'NOT_FOUND', `Request ${id} not found`);

  if (req.requesterId !== actor.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'Only the owner can edit this request');
  }

  const status = deriveStatus(req.events);

  if (status !== 'Draft') {
    throw new ServiceError(403, 'FORBIDDEN', 'Only draft requests can be edited');
  }

  const sanitized = sanitizeValues(values);
  const updated = requestStore.updateValues(id, sanitized);

  return withStatus(updated);
}

export function submitRequest(id: string, actor: User): ExpenseRequestWithStatus {
  const req = requestStore.findById(id);

  if (!req) throw new ServiceError(404, 'NOT_FOUND', `Request ${id} not found`);

  if (req.requesterId !== actor.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'Only the owner can submit this request');
  }

  const status = deriveStatus(req.events);

  if (status !== 'Draft') {
    throw new ServiceError(403, 'FORBIDDEN', 'Only draft requests can be submitted');
  }

  const errors = validateRequestValues(req.values);

  if (hasErrors(errors)) {
    throw new ServiceError(400, 'VALIDATION_FAILED', 'Request has validation errors', errors);
  }

  const chain = resolveChainOrThrow(req, actor);

  const now = new Date().toISOString();
  const updated = requestStore.appendEvent(id, {
    type: 'submitted',
    at: now,
    actorId: actor.id,
    approverId: chain[0],
    approverChain: chain
  });

  return withStatus(updated);
}

export function approveRequest(
  id: string,
  actor: User,
  comment?: string
): ExpenseRequestWithStatus {
  const req = assertSubmittedAndApprover(id, actor);
  const { chain, completed } = deriveApprovalProgress(req.events);
  const isFinalStep = completed + 1 >= chain.length;
  const now = new Date().toISOString();

  const updated = requestStore.appendEvent(
    id,
    isFinalStep
      ? { type: 'approved', at: now, actorId: actor.id, ...(comment ? { comment } : {}) }
      : {
          type: 'step-approved',
          at: now,
          actorId: actor.id,
          approverId: chain[completed + 1],
          ...(comment ? { comment } : {})
        }
  );

  return withStatus(updated);
}

export function rejectRequest(id: string, actor: User, comment?: string): ExpenseRequestWithStatus {
  if (!comment?.trim()) {
    throw new ServiceError(400, 'VALIDATION_FAILED', 'A comment is required when rejecting', {
      comment: 'A comment is required when rejecting'
    });
  }

  assertSubmittedAndApprover(id, actor);

  const now = new Date().toISOString();
  const updated = requestStore.appendEvent(id, {
    type: 'rejected',
    at: now,
    actorId: actor.id,
    comment
  });

  return withStatus(updated);
}

export function resubmitRequest(
  id: string,
  actor: User,
  values: unknown,
  note?: string
): ExpenseRequestWithStatus {
  const req = requestStore.findById(id);

  if (!req) throw new ServiceError(404, 'NOT_FOUND', `Request ${id} not found`);

  if (req.requesterId !== actor.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'Only the owner can resubmit this request');
  }

  const status = deriveStatus(req.events);

  if (status !== 'Rejected') {
    throw new ServiceError(403, 'FORBIDDEN', 'Only rejected requests can be resubmitted');
  }

  const sanitized = sanitizeValues(values);
  const merged: ExpenseRequest = { ...req, values: sanitized };
  const errors = validateRequestValues(merged.values);

  if (hasErrors(errors)) {
    throw new ServiceError(400, 'VALIDATION_FAILED', 'Request has validation errors', errors);
  }

  const chain = resolveChainOrThrow(merged, actor);

  const now = new Date().toISOString();

  requestStore.updateValues(id, sanitized);

  const updated = requestStore.appendEvent(id, {
    type: 'resubmitted',
    at: now,
    actorId: actor.id,
    approverId: chain[0],
    approverChain: chain,
    ...(note ? { note } : {})
  });

  return withStatus(updated);
}

function resolveChainOrThrow(req: ExpenseRequest, actor: User): string[] {
  try {
    return resolveApprovalChain(req, actor, userStore).map(u => u.id);
  } catch (err) {
    if (err instanceof RoutingError) {
      throw new ServiceError(400, 'ROUTING_ERROR', err.message);
    }

    throw err;
  }
}

function assertSubmittedAndApprover(id: string, actor: User): ExpenseRequest {
  const req = requestStore.findById(id);

  if (!req) throw new ServiceError(404, 'NOT_FOUND', `Request ${id} not found`);

  const status = deriveStatus(req.events);

  if (status !== 'Submitted') {
    throw new ServiceError(403, 'FORBIDDEN', 'Only submitted requests can be approved or rejected');
  }

  const { pendingApproverId } = deriveApprovalProgress(req.events);

  if (pendingApproverId !== actor.id) {
    throw new ServiceError(403, 'FORBIDDEN', 'Only the assigned approver can approve or reject');
  }

  return req;
}
