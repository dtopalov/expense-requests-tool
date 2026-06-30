import type { User } from '../models/user.ts';
import type { ExpenseRequest } from '../models/request.ts';

export const mockUsers: User[] = [
  { id: 'u_alice', name: 'Alice Chen', role: 'employee', managerId: 'u_bob' },
  { id: 'u_bob', name: 'Bob Martinez', role: 'manager', managerId: null },
  { id: 'u_carol', name: 'Carol Finance', role: 'finance', managerId: null }
];

const seedRequests: ExpenseRequest[] = [
  {
    id: 'REQ-001',
    requesterId: 'u_alice',
    values: { expenseType: 'Meal', amountCents: 5000, description: 'Team lunch', billable: false },
    events: [{ type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' }],
    status: 'Draft',
    approverId: undefined
  },
  {
    id: 'REQ-002',
    requesterId: 'u_alice',
    values: {
      expenseType: 'Travel',
      amountCents: 45000,
      description: 'NYC trip',
      billable: true,
      client: 'Acme'
    },
    events: [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob' }
    ],
    status: 'Submitted',
    approverId: 'u_bob'
  }
];

let requestStore: ExpenseRequest[] = [...seedRequests];

type Override = (url: URL, method: string, body: unknown) => Response | undefined;

let globalOverride: Override | undefined;

export function resetRequestStore(): void {
  requestStore = [...seedRequests];
  globalOverride = undefined;
}

export function addToStore(request: ExpenseRequest): void {
  requestStore = [...requestStore, request];
}

export function setFetchOverride(fn: Override): void {
  globalOverride = fn;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function parseBody(init: RequestInit | undefined): unknown {
  const raw = init?.body;
  if (!raw || typeof raw !== 'string') return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const rawUrl =
    typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const url = new URL(rawUrl, 'http://localhost');
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const body = parseBody(init);

  if (globalOverride) {
    const result = globalOverride(url, method, body);
    if (result !== undefined) return result;
  }

  const path = url.pathname;

  // Non-API: let react-router internal fetches pass silently
  if (!path.startsWith('/api/')) return new Response('', { status: 200 });

  if (method === 'GET' && path === '/api/users') return json(mockUsers);

  const userById = path.match(/^\/api\/users\/([^/]+)$/);
  if (method === 'GET' && userById) {
    const user = mockUsers.find(u => u.id === userById[1]);
    return user ? json(user) : json({ error: 'NOT_FOUND' }, 404);
  }

  if (method === 'GET' && path === '/api/requests') {
    let results = [...requestStore];
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    if (status) results = results.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        r =>
          r.id.toLowerCase().includes(q) || (r.values.description ?? '').toLowerCase().includes(q)
      );
    }
    return json(results);
  }

  const reqById = path.match(/^\/api\/requests\/([^/]+)$/);
  if (method === 'GET' && reqById) {
    const req = requestStore.find(r => r.id === reqById[1]);
    return req ? json(req) : json({ error: 'NOT_FOUND' }, 404);
  }

  if (method === 'POST' && path === '/api/requests') {
    const newReq: ExpenseRequest = {
      id: `REQ-T${requestStore.length + 1}`,
      requesterId: 'u_alice',
      values: body as ExpenseRequest['values'],
      events: [{ type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' }],
      status: 'Draft',
      approverId: undefined
    };
    requestStore = [...requestStore, newReq];
    return json(newReq, 201);
  }

  if (method === 'PATCH' && reqById) {
    const idx = requestStore.findIndex(r => r.id === reqById[1]);
    if (idx === -1) return json({ error: 'NOT_FOUND' }, 404);
    const updated = { ...requestStore[idx]!, values: body as ExpenseRequest['values'] };
    requestStore = requestStore.map((r, i) => (i === idx ? updated : r));
    return json(updated);
  }

  const action = path.match(/^\/api\/requests\/([^/]+)\/(submit|approve|reject|resubmit)$/);
  if (method === 'POST' && action) {
    const [, id, verb] = action;
    const idx = requestStore.findIndex(r => r.id === id);
    if (idx === -1) return json({ error: 'NOT_FOUND' }, 404);
    const cur = requestStore[idx]!;
    const b = body as Record<string, unknown>;
    let updated: ExpenseRequest;

    if (verb === 'submit') {
      updated = {
        ...cur,
        status: 'Submitted',
        approverId: 'u_bob',
        events: [
          ...cur.events,
          { type: 'submitted', at: '2026-06-01T00:00:00Z', actorId: 'u_alice', approverId: 'u_bob' }
        ]
      };
    } else if (verb === 'approve') {
      updated = {
        ...cur,
        status: 'Approved',
        events: [...cur.events, { type: 'approved', at: '2026-06-01T00:00:00Z', actorId: 'u_bob' }]
      };
    } else if (verb === 'reject') {
      updated = {
        ...cur,
        status: 'Rejected',
        events: [
          ...cur.events,
          {
            type: 'rejected',
            at: '2026-06-01T00:00:00Z',
            actorId: 'u_bob',
            comment: b['comment'] as string | undefined
          }
        ]
      };
    } else {
      updated = {
        ...cur,
        values: (b['values'] ?? cur.values) as ExpenseRequest['values'],
        status: 'Submitted',
        approverId: 'u_bob',
        events: [
          ...cur.events,
          {
            type: 'resubmitted',
            at: '2026-06-01T00:00:00Z',
            actorId: 'u_alice',
            approverId: 'u_bob',
            note: b['note'] as string | undefined
          }
        ]
      };
    }

    requestStore = requestStore.map((r, i) => (i === idx ? updated : r));
    return json(updated);
  }

  return json({ error: 'NOT_FOUND' }, 404);
}
