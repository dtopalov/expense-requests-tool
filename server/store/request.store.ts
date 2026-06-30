import { createRequire } from 'module';
import type { ExpenseRequest, RequestEvent, RequestValues } from '../models/request.model.ts';

const require = createRequire(import.meta.url);
const seedRequests: ExpenseRequest[] = require('../../data/requests.json');

const requests = new Map<string, ExpenseRequest>(seedRequests.map(r => [r.id, r]));
let nextId = seedRequests.length + 1;

function padId(n: number): string {
  return `REQ-${String(n).padStart(3, '0')}`;
}

export const requestStore = {
  findAll(): ExpenseRequest[] {
    return Array.from(requests.values());
  },

  findById(id: string): ExpenseRequest | undefined {
    return requests.get(id);
  },

  create(requesterId: string, values: RequestValues): ExpenseRequest {
    const id = padId(nextId++);
    const now = new Date().toISOString();
    const req: ExpenseRequest = {
      id,
      requesterId,
      values,
      events: [{ type: 'created', at: now, actorId: requesterId }]
    };

    requests.set(id, req);

    return req;
  },

  appendEvent(id: string, event: RequestEvent): ExpenseRequest {
    const req = requests.get(id);

    if (!req) throw new Error(`Request ${id} not found`);

    const updated: ExpenseRequest = {
      ...req,
      events: [...req.events, event]
    };

    requests.set(id, updated);

    return updated;
  },

  updateValues(id: string, values: RequestValues): ExpenseRequest {
    const req = requests.get(id);

    if (!req) throw new Error(`Request ${id} not found`);

    const now = new Date().toISOString();
    const updated: ExpenseRequest = {
      ...req,
      values,
      events: [...req.events, { type: 'updated', at: now, actorId: req.requesterId }]
    };

    requests.set(id, updated);

    return updated;
  }
};
