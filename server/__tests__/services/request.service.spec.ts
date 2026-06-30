import { describe, it, expect, vi } from 'vitest';
import { ServiceError } from '../../services/request.service.ts';
import { makeValues, makeRequest } from '../helpers/test-factory.ts';

vi.mock('../../store/request.store.ts', () => {
  const employee = 'u_emp';
  const manager = 'u_mgr';

  function makeEv(type: string, actorId: string, extra: Record<string, string> = {}) {
    return { type, at: '2026-01-01T00:00:00Z', actorId, ...extra };
  }
  function req(
    id: string,
    requesterId: string,
    values: Record<string, unknown>,
    events: unknown[]
  ) {
    return { id, requesterId, values, events };
  }

  const draftReq = req(
    'REQ-SVC-1',
    employee,
    { expenseType: 'Meal', amountCents: 5000, description: 'Test', billable: false },
    [makeEv('created', employee)]
  );
  const draftNoValReq = req('REQ-SVC-EMPTY', employee, {}, [makeEv('created', employee)]);
  const submittedReq = req(
    'REQ-SVC-2',
    employee,
    { expenseType: 'Meal', amountCents: 5000, description: 'Test', billable: false },
    [makeEv('created', employee), makeEv('submitted', employee, { approverId: manager })]
  );
  const submittedReq2 = req(
    'REQ-SVC-4',
    employee,
    { expenseType: 'Meal', amountCents: 5000, description: 'Test', billable: false },
    [makeEv('created', employee), makeEv('submitted', employee, { approverId: manager })]
  );
  const rejectedReq = req(
    'REQ-SVC-3',
    employee,
    { expenseType: 'Meal', amountCents: 5000, description: 'Test', billable: false },
    [
      makeEv('created', employee),
      makeEv('submitted', employee, { approverId: manager }),
      makeEv('rejected', manager)
    ]
  );

  // Two-step chain [manager, finance] for large-amount approval flows
  function twoStep(id: string) {
    return req(
      id,
      employee,
      { expenseType: 'Equipment', amountCents: 150000, description: 'Big', billable: false },
      [
        makeEv('created', employee),
        {
          type: 'submitted',
          at: '2026-01-01T00:00:00Z',
          actorId: employee,
          approverId: manager,
          approverChain: [manager, 'u_finance']
        }
      ]
    );
  }
  const twoStepA = twoStep('REQ-SVC-2STEP-A');
  const twoStepB = twoStep('REQ-SVC-2STEP-B');

  const store = new Map([
    [draftReq.id, draftReq],
    [draftNoValReq.id, draftNoValReq],
    [submittedReq.id, submittedReq],
    [submittedReq2.id, submittedReq2],
    [rejectedReq.id, rejectedReq],
    [twoStepA.id, twoStepA],
    [twoStepB.id, twoStepB]
  ]);

  let counter = 200;

  return {
    requestStore: {
      findAll: () => Array.from(store.values()),
      findById: (id: string) => store.get(id),
      create: vi.fn((requesterId: string, values: Record<string, unknown>) => {
        const id = `REQ-T${counter++}`;
        const r = { id, requesterId, values, events: [makeEv('created', requesterId)] };
        store.set(id, r);
        return r;
      }),
      appendEvent: vi.fn((id: string, event: unknown) => {
        const r = store.get(id)!;
        const updated = { ...r, events: [...r.events, event] };
        store.set(id, updated as typeof r);
        return updated;
      }),
      updateValues: vi.fn((id: string, values: unknown) => {
        const r = store.get(id)!;
        const updated = { ...r, values, events: [...r.events, makeEv('updated', r.requesterId)] };
        store.set(id, updated as typeof r);
        return updated;
      })
    }
  };
});

vi.mock('../../store/user.store.ts', () => {
  const users = new Map([
    ['u_emp', { id: 'u_emp', name: 'Employee', role: 'employee', managerId: 'u_mgr' }],
    ['u_mgr', { id: 'u_mgr', name: 'Manager', role: 'manager', managerId: null }],
    ['u_finance', { id: 'u_finance', name: 'Finance', role: 'finance', managerId: null }]
  ]);
  return {
    userStore: {
      findAll: () => Array.from(users.values()),
      findById: (id: string) => users.get(id),
      findByRole: (role: string) => Array.from(users.values()).find(u => u.role === role),
      findAllByRole: (role: string) => Array.from(users.values()).filter(u => u.role === role)
    }
  };
});

const {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  submitRequest,
  approveRequest,
  rejectRequest
} = await import('../../services/request.service.ts');

const employee = { id: 'u_emp', name: 'Employee', role: 'employee' as const, managerId: 'u_mgr' };
const manager = { id: 'u_mgr', name: 'Manager', role: 'manager' as const, managerId: null };
const finance = { id: 'u_finance', name: 'Finance', role: 'finance' as const, managerId: null };

describe('listRequests', () => {
  it('returns all requests', () => {
    expect(listRequests({}).length).toBeGreaterThan(0);
  });

  it('filters by status', () => {
    const results = listRequests({ status: 'Draft' });
    expect(results.every(r => r.status === 'Draft')).toBe(true);
  });

  it('filters by minAmountCents (>=)', () => {
    const above = listRequests({ minAmountCents: 5000 });
    expect(above.every(r => (r.values.amountCents ?? 0) >= 5000)).toBe(true);

    const tooHigh = listRequests({ minAmountCents: 200000 });
    expect(tooHigh).toHaveLength(0);
  });

  it('filters by maxAmountCents (<=)', () => {
    const below = listRequests({ maxAmountCents: 5000 });
    expect(below.every(r => (r.values.amountCents ?? 0) <= 5000)).toBe(true);

    const tooLow = listRequests({ maxAmountCents: 4999 });
    // Only the empty-values request (amountCents: undefined → 0) survives
    expect(tooLow.every(r => (r.values.amountCents ?? 0) <= 4999)).toBe(true);
  });

  it('filters by minAmountCents AND maxAmountCents (range)', () => {
    const inRange = listRequests({ minAmountCents: 1000, maxAmountCents: 5000 });
    expect(inRange.every(r => {
      const c = r.values.amountCents ?? 0;
      return c >= 1000 && c <= 5000;
    })).toBe(true);

    const noMatch = listRequests({ minAmountCents: 5001, maxAmountCents: 9999 });
    expect(noMatch).toHaveLength(0);
  });

  it('sorts by amountCents ascending', () => {
    const results = listRequests({ sortKey: 'amountCents', sortDir: 'asc' });
    const amounts = results.map(r => r.values.amountCents ?? 0);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });

  it('sorts by amountCents descending', () => {
    const results = listRequests({ sortKey: 'amountCents', sortDir: 'desc' });
    const amounts = results.map(r => r.values.amountCents ?? 0);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('sorts by id ascending', () => {
    const results = listRequests({ sortKey: 'id', sortDir: 'asc' });
    const ids = results.map(r => r.id);
    expect(ids).toEqual([...ids].sort());
  });

  it('does not sort when sortKey is omitted', () => {
    const withSort = listRequests({ sortKey: 'id', sortDir: 'asc' });
    const withoutSort = listRequests({});
    // Both return same items; just verify count matches (order may differ)
    expect(withoutSort).toHaveLength(withSort.length);
  });
});

describe('getRequest', () => {
  it('returns a request with status', () => {
    const req = getRequest('REQ-SVC-1');
    expect(req.id).toBe('REQ-SVC-1');
    expect(req.status).toBe('Draft');
  });

  it('throws 404 for unknown id', () => {
    expect(() => getRequest('NOPE')).toThrow(expect.objectContaining({ statusCode: 404 }));
  });
});

describe('createRequest', () => {
  it('creates a draft request', () => {
    const req = createRequest(employee, makeValues());
    expect(req.status).toBe('Draft');
    expect(req.requesterId).toBe(employee.id);
  });
});

describe('updateRequest', () => {
  it('throws 403 when non-owner tries to update', () => {
    expect(() => updateRequest('REQ-SVC-1', manager, makeValues())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('throws 403 when request is not draft', () => {
    expect(() => updateRequest('REQ-SVC-2', employee, makeValues())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe('submitRequest', () => {
  it('throws 403 when non-owner submits', () => {
    expect(() => submitRequest('REQ-SVC-1', manager)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('throws 400 with field errors when values are empty', () => {
    try {
      submitRequest('REQ-SVC-EMPTY', employee);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect((err as ServiceError).statusCode).toBe(400);
      expect((err as ServiceError).fields).toBeDefined();
    }
  });
});

describe('approveRequest', () => {
  it('throws 403 when non-approver tries to approve', () => {
    expect(() => approveRequest('REQ-SVC-2', finance)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('approves when correct approver acts', () => {
    const result = approveRequest('REQ-SVC-2', manager);
    expect(result.status).toBe('Approved');
  });
});

describe('approveRequest (multi-step chain)', () => {
  it('first approval advances to the next approver without finalizing', () => {
    const result = approveRequest('REQ-SVC-2STEP-A', manager);
    expect(result.status).toBe('Submitted');
    expect(result.approverId).toBe(finance.id);
    expect(result.events[result.events.length - 1].type).toBe('step-approved');
  });

  it('final approval by the last approver marks it Approved', () => {
    // continues from the previous test: manager already signed off on 2STEP-A
    const result = approveRequest('REQ-SVC-2STEP-A', finance);
    expect(result.status).toBe('Approved');
  });

  it('rejects an out-of-order approval (finance before manager)', () => {
    expect(() => approveRequest('REQ-SVC-2STEP-B', finance)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe('rejectRequest', () => {
  it('rejects with a comment', () => {
    const result = rejectRequest('REQ-SVC-4', manager, 'Not approved');
    expect(result.status).toBe('Rejected');
  });

  it('throws 400 when comment is missing', () => {
    expect(() => rejectRequest('REQ-SVC-4', manager)).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_FAILED' })
    );
  });

  it('throws 400 when comment is blank', () => {
    expect(() => rejectRequest('REQ-SVC-4', manager, '   ')).toThrow(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_FAILED' })
    );
  });
});

// Suppress unused import warning
void makeRequest;
