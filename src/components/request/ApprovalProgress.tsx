import type { RequestEvent } from '../../models/request.ts';
import type { User } from '../../models/user.ts';
import { deriveApprovalProgress } from '../../models/request.ts';

type StepState = 'approved' | 'pending' | 'rejected' | 'upcoming';

const STATE_LABEL: Record<StepState, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  upcoming: 'Waiting'
};

const STATE_MARK: Record<StepState, string> = {
  approved: '✓',
  pending: '●',
  rejected: '✕',
  upcoming: '○'
};

interface ApprovalProgressProps {
  events: RequestEvent[];
  users: User[];
}

function userName(id: string, users: User[]): string {
  return users.find(u => u.id === id)?.name ?? id;
}

export function ApprovalProgress({ events, users }: ApprovalProgressProps): React.ReactElement | null {
  const { chain, completed } = deriveApprovalProgress(events);

  // Only multi-step chains need a progress indicator; single sign-offs are clear
  // enough from the history timeline.
  if (chain.length < 2) return null;

  const isRejected = events[events.length - 1]?.type === 'rejected';

  function stepState(index: number): StepState {
    if (index < completed) return 'approved';
    if (index === completed) return isRejected ? 'rejected' : 'pending';
    return 'upcoming';
  }

  return (
    <section className="approval-progress" aria-label="Approval progress">
      <h2 className="approval-progress__title">
        Approval progress ({Math.min(completed, chain.length)} of {chain.length})
      </h2>
      <ol className="approval-progress__steps">
        {chain.map((id, i) => {
          const state = stepState(i);

          return (
            <li
              key={id}
              className={`approval-progress__step approval-progress__step--${state}`}
            >
              <span className="approval-progress__mark" aria-hidden="true">
                {STATE_MARK[state]}
              </span>
              <span className="approval-progress__name">{userName(id, users)}</span>
              <span className="approval-progress__state">{STATE_LABEL[state]}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
