import type { User } from '../../models/user.model.ts';
import type { ExpenseRequest, RequestValues, RequestEvent } from '../../models/request.model.ts';

let idCounter = 100;

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: `u_test_${idCounter++}`,
    name: 'Test User',
    role: 'employee',
    managerId: null,
    ...overrides
  };
}

export function makeRequest(overrides: Partial<ExpenseRequest> = {}): ExpenseRequest {
  const id = `REQ-T${idCounter++}`;
  const requesterId = `u_test_${idCounter++}`;
  return {
    id,
    requesterId,
    values: makeValues(),
    events: [{ type: 'created', at: '2026-06-01T00:00:00Z', actorId: requesterId }],
    ...overrides
  };
}

export function makeValues(overrides: Partial<RequestValues> = {}): RequestValues {
  return {
    expenseType: 'Meal',
    amountCents: 5000,
    description: 'Test expense',
    billable: false,
    ...overrides
  };
}

export function makeEvent(overrides: Partial<RequestEvent> = {}): RequestEvent {
  return {
    type: 'created',
    at: '2026-06-01T00:00:00Z',
    actorId: `u_test_${idCounter++}`,
    ...overrides
  };
}

export function makeSubmittedRequest(
  requesterId: string,
  approverId: string,
  values?: Partial<RequestValues>
): ExpenseRequest {
  return makeRequest({
    requesterId,
    values: makeValues(values),
    events: [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: requesterId },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: requesterId, approverId }
    ]
  });
}

export function makeRejectedRequest(
  requesterId: string,
  approverId: string,
  values?: Partial<RequestValues>
): ExpenseRequest {
  return makeRequest({
    requesterId,
    values: makeValues(values),
    events: [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: requesterId },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: requesterId, approverId },
      { type: 'rejected', at: '2026-06-01T02:00:00Z', actorId: approverId }
    ]
  });
}
