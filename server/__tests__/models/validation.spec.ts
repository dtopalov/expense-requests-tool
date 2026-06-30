import { describe, it, expect } from 'vitest';
import { validateRequestValues } from '../../models/validation.ts';
import { makeValues } from '../helpers/test-factory.ts';

describe('validateRequestValues', () => {
  it('returns no errors for valid values', () => {
    const errors = validateRequestValues(makeValues());
    expect(errors).toEqual({});
  });

  it('requires expenseType', () => {
    const errors = validateRequestValues(makeValues({ expenseType: undefined }));
    expect(errors['expenseType']).toBeDefined();
  });

  it('requires amountCents', () => {
    const errors = validateRequestValues(makeValues({ amountCents: undefined }));
    expect(errors['amountCents']).toBeDefined();
  });

  it('rejects negative amountCents', () => {
    const errors = validateRequestValues(makeValues({ amountCents: -1 }));
    expect(errors['amountCents']).toBeDefined();
  });

  it('rejects non-integer amountCents', () => {
    const errors = validateRequestValues(makeValues({ amountCents: 10.5 }));
    expect(errors['amountCents']).toBeDefined();
  });

  it('accepts zero amountCents', () => {
    const errors = validateRequestValues(makeValues({ amountCents: 0 }));
    expect(errors['amountCents']).toBeUndefined();
  });

  it('requires description', () => {
    const errors = validateRequestValues(makeValues({ description: '' }));
    expect(errors['description']).toBeDefined();
  });

  it('requires client when billable', () => {
    const errors = validateRequestValues(makeValues({ billable: true, client: undefined }));
    expect(errors['client']).toBeDefined();
  });

  it('does not require client when not billable', () => {
    const errors = validateRequestValues(makeValues({ billable: false, client: undefined }));
    expect(errors['client']).toBeUndefined();
  });

  it('requires additionalJustification when amount >= 100000', () => {
    const errors = validateRequestValues(
      makeValues({ amountCents: 100000, additionalJustification: undefined })
    );
    expect(errors['additionalJustification']).toBeDefined();
  });

  it('does not require additionalJustification when amount < 100000', () => {
    const errors = validateRequestValues(makeValues({ amountCents: 99999 }));
    expect(errors['additionalJustification']).toBeUndefined();
  });

  it('requires otherReason when expenseType is Other', () => {
    const errors = validateRequestValues(
      makeValues({ expenseType: 'Other', otherReason: undefined })
    );
    expect(errors['otherReason']).toBeDefined();
  });

  it('does not require otherReason for non-Other types', () => {
    const errors = validateRequestValues(
      makeValues({ expenseType: 'Meal', otherReason: undefined })
    );
    expect(errors['otherReason']).toBeUndefined();
  });

  it('returns multiple errors when multiple fields fail', () => {
    const errors = validateRequestValues({});
    expect(Object.keys(errors).length).toBeGreaterThan(1);
  });
});
