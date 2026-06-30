import type { User } from '../models/user.model.ts';
import type { ExpenseRequest } from '../models/request.model.ts';
import { LARGE_AMOUNT_THRESHOLD_CENTS } from '../models/request.model.ts';
import type { userStore as UserStore } from '../store/user.store.ts';

export class RoutingError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'RoutingError';
  }
}

function pickFinance(store: typeof UserStore, requesterId: string): User | undefined {
  return store.findAllByRole('finance').find(u => u.id !== requesterId);
}

/**
 * Resolves the ordered chain of approvers a request must clear before it is
 * fully approved. Small expenses need a single sign-off (manager, or finance as
 * a fallback); large expenses (>= $1,000) need the manager AND finance in order.
 * No approver is ever the requester, and the chain never contains duplicates.
 */
export function resolveApprovalChain(
  request: ExpenseRequest,
  requester: User,
  store: typeof UserStore
): User[] {
  const amountCents = request.values.amountCents ?? 0;
  const isLarge = amountCents >= LARGE_AMOUNT_THRESHOLD_CENTS;
  const chain: User[] = [];

  if (requester.managerId) {
    const manager = store.findById(requester.managerId);
    if (manager && manager.id !== requester.id) {
      chain.push(manager);
    }
  }

  // Finance signs off on large amounts, and stands in when there is no manager.
  if (isLarge || chain.length === 0) {
    const finance = pickFinance(store, requester.id);

    if (finance && !chain.some(u => u.id === finance.id)) {
      chain.push(finance);
    } else if (isLarge && !finance) {
      throw new RoutingError(
        'Cannot submit: finance approval is required for this amount but no eligible finance approver exists'
      );
    }
  }

  if (chain.length === 0) {
    throw new RoutingError('Cannot submit: you are both requester and sole approver');
  }

  return chain;
}
