import { describe, it, expect } from 'vitest';
import { validateRequestValues } from '../../validation/request.validation.ts';

const validBase = {
  expenseType: 'Meal' as const,
  amountCents: 5000,
  description: 'Test expense',
  billable: false
};

describe('validateRequestValues', () => {
  it('returns no errors for valid values', () => {
    expect(validateRequestValues(validBase)).toEqual({});
  });

  it('requires expenseType', () => {
    const { expenseType: _, ...rest } = validBase;
    expect(validateRequestValues(rest)).toHaveProperty('expenseType');
  });

  it('requires amountCents', () => {
    const { amountCents: _, ...rest } = validBase;
    expect(validateRequestValues(rest)).toHaveProperty('amountCents');
  });

  it('rejects negative amounts', () => {
    expect(validateRequestValues({ ...validBase, amountCents: -1 })).toHaveProperty('amountCents');
  });

  it('accepts zero amounts', () => {
    expect(validateRequestValues({ ...validBase, amountCents: 0 })).not.toHaveProperty(
      'amountCents'
    );
  });

  it('requires description', () => {
    expect(validateRequestValues({ ...validBase, description: '' })).toHaveProperty('description');
  });

  it('requires client when billable', () => {
    expect(validateRequestValues({ ...validBase, billable: true })).toHaveProperty('client');
  });

  it('does not require client when not billable', () => {
    expect(validateRequestValues({ ...validBase, billable: false })).not.toHaveProperty('client');
  });

  it('requires additionalJustification when amount >= 100000', () => {
    expect(validateRequestValues({ ...validBase, amountCents: 100000 })).toHaveProperty(
      'additionalJustification'
    );
  });

  it('does not require additionalJustification below threshold', () => {
    expect(validateRequestValues({ ...validBase, amountCents: 99999 })).not.toHaveProperty(
      'additionalJustification'
    );
  });

  it('requires otherReason when type is Other', () => {
    expect(validateRequestValues({ ...validBase, expenseType: 'Other' as const })).toHaveProperty(
      'otherReason'
    );
  });

  it('does not require otherReason for other types', () => {
    expect(
      validateRequestValues({ ...validBase, expenseType: 'Travel' as const })
    ).not.toHaveProperty('otherReason');
  });
});
