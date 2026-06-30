import { apiFetch } from './client.ts';
import type { ExpenseRequest, RequestValues } from '../models/request.ts';

export interface ListQuery {
  status?: string;
  search?: string;
  requesterId?: string;
  minAmountCents?: number;
  maxAmountCents?: number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

function buildQuery(q: ListQuery): string {
  const params = new URLSearchParams();

  if (q.status) params.set('status', q.status);
  if (q.search) params.set('search', q.search);
  if (q.requesterId) params.set('requesterId', q.requesterId);
  if (q.minAmountCents !== undefined) params.set('minAmountCents', String(q.minAmountCents));
  if (q.maxAmountCents !== undefined) params.set('maxAmountCents', String(q.maxAmountCents));
  if (q.sortKey) params.set('sortKey', q.sortKey);
  if (q.sortDir) params.set('sortDir', q.sortDir);

  const qs = params.toString();

  return qs ? `?${qs}` : '';
}

export function fetchRequests(query: ListQuery = {}): Promise<ExpenseRequest[]> {
  return apiFetch<ExpenseRequest[]>(`/api/requests${buildQuery(query)}`);
}

export function fetchRequest(id: string): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}`);
}

export function createRequest(values: RequestValues): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>('/api/requests', {
    method: 'POST',
    body: JSON.stringify(values)
  });
}

export function updateRequest(id: string, values: RequestValues): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(values)
  });
}

export function submitRequest(id: string): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}/submit`, { method: 'POST' });
}

export function approveRequest(id: string, comment?: string): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
}

export function rejectRequest(id: string, comment?: string): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
}

export function resubmitRequest(
  id: string,
  values: RequestValues,
  note?: string
): Promise<ExpenseRequest> {
  return apiFetch<ExpenseRequest>(`/api/requests/${id}/resubmit`, {
    method: 'POST',
    body: JSON.stringify({ values, note })
  });
}
