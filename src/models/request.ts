import type { ExpenseType, RequestStatus } from './constants.ts';

export type EventType =
  | 'created'
  | 'updated'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'resubmitted'
  | 'step-approved';

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
  status: RequestStatus;
  approverId: string | undefined;
}

export interface ApprovalProgress {
  chain: string[];
  completed: number;
  pendingApproverId: string | undefined;
}

/**
 * Mirrors the server's progress derivation for display: reads the approver chain
 * from the latest submit/resubmit event and counts sign-offs since.
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
