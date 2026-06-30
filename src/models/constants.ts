export const EXPENSE_TYPES = ['Travel', 'Software', 'Equipment', 'Meal', 'Other'] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];

export const CLIENTS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Wonka'] as const;
export type Client = (typeof CLIENTS)[number];

export const REQUEST_STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const LARGE_AMOUNT_THRESHOLD_CENTS = 100000;
