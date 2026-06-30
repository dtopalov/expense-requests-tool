import type { RequestEvent } from '../../models/request.ts';
import type { User } from '../../models/user.ts';

const EVENT_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmitted: 'Resubmitted',
  'step-approved': 'Approved (step)'
};

interface RequestHistoryProps {
  events: RequestEvent[];
  users: User[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso));
}

function userName(id: string, users: User[]): string {
  return users.find(u => u.id === id)?.name ?? id;
}

export function RequestHistory({ events, users }: RequestHistoryProps): React.ReactElement {
  return (
    <section className="history" aria-label="Request history">
      <h2 className="history__title">History</h2>
      <ol className="history__list" reversed>
        {[...events].reverse().map((ev, i) => (
          <li key={i} className={`history__event history__event--${ev.type}`}>
            <span className="history__event-type">{EVENT_LABELS[ev.type] ?? ev.type}</span>
            <span className="history__event-actor">by {userName(ev.actorId, users)}</span>
            <time className="history__event-time" dateTime={ev.at}>
              {formatDate(ev.at)}
            </time>
            {ev.approverId && (
              <span className="history__event-detail">
                Assigned to: {userName(ev.approverId, users)}
              </span>
            )}
            {ev.comment && <blockquote className="history__event-comment">{ev.comment}</blockquote>}
            {ev.note && <p className="history__event-note">Note: {ev.note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
