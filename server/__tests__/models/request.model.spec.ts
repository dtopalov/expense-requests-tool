import { describe, it, expect } from 'vitest';
import {
  sanitizeValues,
  deriveStatus,
  deriveApprovalProgress
} from '../../models/request.model.ts';
import type { RequestEvent } from '../../models/request.model.ts';
import { makeEvent } from '../helpers/test-factory.ts';

describe('sanitizeValues', () => {
  it('returns empty object for non-object input', () => {
    expect(sanitizeValues(null)).toEqual({});
    expect(sanitizeValues(undefined)).toEqual({});
    expect(sanitizeValues('string')).toEqual({});
    expect(sanitizeValues(42)).toEqual({});
  });

  it('picks known string fields', () => {
    const result = sanitizeValues({
      expenseType: 'Meal',
      description: 'lunch',
      unknownField: 'dropped'
    });
    expect(result).toHaveProperty('expenseType', 'Meal');
    expect(result).toHaveProperty('description', 'lunch');
    expect(result).not.toHaveProperty('unknownField');
  });

  it('drops unknown keys', () => {
    const result = sanitizeValues({ foo: 'bar', baz: 123, expenseType: 'Travel' });
    expect(Object.keys(result)).toEqual(['expenseType']);
  });

  it('coerces numeric string amountCents to number', () => {
    const result = sanitizeValues({ amountCents: '5000' });
    expect(result.amountCents).toBe(5000);
  });

  it('keeps numeric amountCents as-is', () => {
    const result = sanitizeValues({ amountCents: 7500 });
    expect(result.amountCents).toBe(7500);
  });

  it('drops amountCents when non-numeric string', () => {
    const result = sanitizeValues({ amountCents: 'abc' });
    expect(result).not.toHaveProperty('amountCents');
  });

  it('coerces billable to boolean', () => {
    expect(sanitizeValues({ billable: 1 }).billable).toBe(true);
    expect(sanitizeValues({ billable: 0 }).billable).toBe(false);
    expect(sanitizeValues({ billable: true }).billable).toBe(true);
  });

  it('omits billable when not present', () => {
    const result = sanitizeValues({ description: 'test' });
    expect(result).not.toHaveProperty('billable');
  });

  it('preserves all known RequestValues fields', () => {
    const input = {
      expenseType: 'Travel',
      amountCents: 10000,
      description: 'Trip',
      billable: true,
      client: 'Acme',
      additionalJustification: 'Big trip',
      otherReason: '',
      destination: 'NYC',
      travelStartDate: '2026-01-01',
      travelEndDate: '2026-01-05',
      vendor: 'Delta',
      vendorReason: 'Cheapest',
      injected: 'evil'
    };
    const result = sanitizeValues(input);
    expect(result).toMatchObject({
      expenseType: 'Travel',
      amountCents: 10000,
      description: 'Trip',
      billable: true,
      client: 'Acme',
      additionalJustification: 'Big trip',
      destination: 'NYC',
      travelStartDate: '2026-01-01',
      travelEndDate: '2026-01-05',
      vendor: 'Delta',
      vendorReason: 'Cheapest'
    });
    expect(result).not.toHaveProperty('injected');
  });
});

describe('deriveStatus', () => {
  it('throws when events array is empty', () => {
    expect(() => deriveStatus([])).toThrow('Cannot derive status: request has no events');
  });

  it('returns Draft for created event', () => {
    expect(deriveStatus([makeEvent({ type: 'created' })])).toBe('Draft');
  });

  it('returns Draft for updated event', () => {
    expect(deriveStatus([makeEvent({ type: 'updated' })])).toBe('Draft');
  });

  it('returns Submitted for submitted event', () => {
    expect(deriveStatus([makeEvent({ type: 'submitted' })])).toBe('Submitted');
  });

  it('returns Approved for approved event', () => {
    expect(deriveStatus([makeEvent({ type: 'approved' })])).toBe('Approved');
  });

  it('returns Rejected for rejected event', () => {
    expect(deriveStatus([makeEvent({ type: 'rejected' })])).toBe('Rejected');
  });

  it('returns Submitted for step-approved event (chain still in progress)', () => {
    expect(deriveStatus([makeEvent({ type: 'step-approved' })])).toBe('Submitted');
  });
});

describe('deriveApprovalProgress', () => {
  const chain = ['u_mgr', 'u_finance'];

  function events(...types: { type: RequestEvent['type']; approverChain?: string[] }[]): RequestEvent[] {
    return types.map(t => makeEvent({ type: t.type, approverChain: t.approverChain }));
  }

  it('returns an empty chain when never submitted', () => {
    const result = deriveApprovalProgress(events({ type: 'created' }));
    expect(result).toEqual({ chain: [], completed: 0, pendingApproverId: undefined });
  });

  it('reports the first approver as pending right after submit', () => {
    const result = deriveApprovalProgress(
      events({ type: 'created' }, { type: 'submitted', approverChain: chain })
    );
    expect(result.completed).toBe(0);
    expect(result.pendingApproverId).toBe('u_mgr');
  });

  it('advances the pending approver after a step approval', () => {
    const result = deriveApprovalProgress(
      events({ type: 'created' }, { type: 'submitted', approverChain: chain }, { type: 'step-approved' })
    );
    expect(result.completed).toBe(1);
    expect(result.pendingApproverId).toBe('u_finance');
  });

  it('has no pending approver once the whole chain is approved', () => {
    const result = deriveApprovalProgress(
      events(
        { type: 'created' },
        { type: 'submitted', approverChain: chain },
        { type: 'step-approved' },
        { type: 'approved' }
      )
    );
    expect(result.completed).toBe(2);
    expect(result.pendingApproverId).toBeUndefined();
  });

  it('falls back to approverId for legacy single-approver events', () => {
    const legacy: RequestEvent[] = [
      makeEvent({ type: 'created' }),
      makeEvent({ type: 'submitted', approverId: 'u_bob' })
    ];
    const result = deriveApprovalProgress(legacy);
    expect(result.chain).toEqual(['u_bob']);
    expect(result.pendingApproverId).toBe('u_bob');
  });
});
