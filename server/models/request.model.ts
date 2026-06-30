export type ExpenseType = 'Travel' | 'Software' | 'Equipment' | 'Meal' | 'Other';
export type RequestStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
export type EventType =
  | 'created'
  | 'updated'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'resubmitted'
  | 'step-approved';

export const LARGE_AMOUNT_THRESHOLD_CENTS = 100000;

export interface RequestValues {
  expenseType?: ExpenseType;
  amountCents?: number;
  description?: string;
  billable?: boolean;
  client?: string;
  additionalJustification?: string;
  otherReason?: string;
  destination?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  vendor?: string;
  vendorReason?: string;
}

export interface RequestEvent {
  type: EventType;
  at: string;
  actorId: string;
  approverId?: string;
  approverChain?: string[];
  comment?: string;
  note?: string;
}

export interface ExpenseRequest {
  id: string;
  requesterId: string;
  values: RequestValues;
  events: RequestEvent[];
}

export interface ExpenseRequestWithStatus extends ExpenseRequest {
  status: RequestStatus;
  approverId: string | undefined;
}

export function deriveStatus(events: RequestEvent[]): RequestStatus {
  if (events.length === 0) {
    throw new Error('Cannot derive status: request has no events');
  }

  const last = events[events.length - 1];

  switch (last.type) {
    case 'created':
    case 'updated':
      return 'Draft';
    case 'submitted':
    case 'resubmitted':
    case 'step-approved':
      return 'Submitted';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
  }
}

export interface ApprovalProgress {
  chain: string[];
  completed: number;
  pendingApproverId: string | undefined;
}

/**
 * Walks back to the most recent submit/resubmit and reads its approver chain,
 * then counts how many steps have been signed off since. The pending approver
 * is the next chain entry; once every step is signed off there is none.
 */
export function deriveApprovalProgress(events: RequestEvent[]): ApprovalProgress {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];

    if (ev.type === 'submitted' || ev.type === 'resubmitted') {
      const chain = ev.approverChain ?? (ev.approverId ? [ev.approverId] : []);
      let completed = 0;

      for (let j = i + 1; j < events.length; j++) {
        const t = events[j].type;
        if (t === 'step-approved' || t === 'approved') completed++;
      }

      return { chain, completed, pendingApproverId: chain[completed] };
    }
  }

  return { chain: [], completed: 0, pendingApproverId: undefined };
}

export function deriveApproverId(events: RequestEvent[]): string | undefined {
  return deriveApprovalProgress(events).pendingApproverId;
}

export function withStatus(req: ExpenseRequest): ExpenseRequestWithStatus {
  return {
    ...req,
    status: deriveStatus(req.events),
    approverId: deriveApproverId(req.events)
  };
}

const STRING_KEYS = [
  'expenseType',
  'description',
  'client',
  'additionalJustification',
  'otherReason',
  'destination',
  'travelStartDate',
  'travelEndDate',
  'vendor',
  'vendorReason'
] as const satisfies ReadonlyArray<keyof RequestValues>;

export function sanitizeValues(input: unknown): RequestValues {
  if (typeof input !== 'object' || input === null) return {};

  const raw = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of STRING_KEYS) {
    if (raw[key] !== undefined) {
      out[key] = typeof raw[key] === 'string' ? raw[key] : String(raw[key]);
    }
  }

  if (raw['amountCents'] !== undefined) {
    const v = raw['amountCents'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out['amountCents'] = v;
    } else if (typeof v === 'string') {
      const n = Number(v);
      if (Number.isFinite(n)) out['amountCents'] = n;
    }
  }

  if (raw['billable'] !== undefined) {
    out['billable'] = Boolean(raw['billable']);
  }

  return out as RequestValues;
}
