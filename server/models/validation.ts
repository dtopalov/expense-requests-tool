import type { RequestValues, ExpenseType } from './request.model.ts';
import { LARGE_AMOUNT_THRESHOLD_CENTS } from './request.model.ts';

const EXPENSE_TYPES: ExpenseType[] = ['Travel', 'Software', 'Equipment', 'Meal', 'Other'];

export type ValidationErrors = Record<string, string>;

export function validateRequestValues(values: RequestValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.expenseType || !EXPENSE_TYPES.includes(values.expenseType)) {
    errors['expenseType'] = 'Expense type is required';
  }

  if (values.amountCents === undefined || values.amountCents === null) {
    errors['amountCents'] = 'Amount is required';
  } else if (!Number.isInteger(values.amountCents) || values.amountCents < 0) {
    errors['amountCents'] = 'Amount must be a non-negative whole number of cents';
  }

  if (!values.description?.trim()) {
    errors['description'] = 'Description is required';
  }

  if (values.billable && !values.client) {
    errors['client'] = 'Client is required when billable';
  }

  if ((values.amountCents ?? 0) >= LARGE_AMOUNT_THRESHOLD_CENTS && !values.additionalJustification?.trim()) {
    errors['additionalJustification'] =
      'Additional justification is required for amounts of $1,000 or more';
  }

  if (values.expenseType === 'Other' && !values.otherReason?.trim()) {
    errors['otherReason'] = 'Reason is required when expense type is Other';
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
