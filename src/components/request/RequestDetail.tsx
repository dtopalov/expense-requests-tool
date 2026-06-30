import type { ExpenseRequest } from '../../models/request.ts';
import type { User } from '../../models/user.ts';
import { StatusBadge } from '../list/StatusBadge.tsx';
import { RequestHistory } from './RequestHistory.tsx';
import { ApprovalActions } from './ApprovalActions.tsx';
import { ApprovalProgress } from './ApprovalProgress.tsx';
import { ResubmitBanner } from './ResubmitBanner.tsx';
import { Link } from 'react-router';

function formatCents(cents: number | undefined): string {
  if (cents === undefined) return '—';

  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function row(label: string, value: string | undefined): React.ReactElement | null {
  if (!value) return null;

  return (
    <tr>
      <th scope="row" className="detail__label">
        {label}
      </th>
      <td className="detail__value">{value}</td>
    </tr>
  );
}

interface RequestDetailProps {
  request: ExpenseRequest;
  currentUser: User;
  users: User[];
  onUpdate: () => void;
}

export function RequestDetail({
  request,
  currentUser,
  users,
  onUpdate
}: RequestDetailProps): React.ReactElement {
  const isOwner = request.requesterId === currentUser.id;
  const isAssignedApprover = request.approverId === currentUser.id;
  const isDraft = request.status === 'Draft';
  const isSubmitted = request.status === 'Submitted';
  const isRejected = request.status === 'Rejected';

  const requester = users.find(u => u.id === request.requesterId);

  return (
    <article className="detail">
      <header className="detail__header">
        <div className="detail__title-row">
          <h1 className="detail__id">{request.id}</h1>
          <StatusBadge status={request.status} />
        </div>
        <div className="detail__actions">
          {isOwner && isDraft && (
            <Link to={`/${request.id}/edit`} className="btn btn--secondary" tabIndex={0}>
              Edit
            </Link>
          )}
        </div>
      </header>

      {isOwner && isRejected && <ResubmitBanner request={request} />}

      <section className="detail__fields" aria-label="Request details">
        <table className="detail__table">
          <tbody>
            {row('Requester', requester?.name)}
            {row('Type', request.values.expenseType)}
            {row('Amount', formatCents(request.values.amountCents))}
            {row('Description', request.values.description)}
            {row(
              'Billable',
              request.values.billable ? `Yes — ${request.values.client ?? ''}` : 'No'
            )}
            {request.values.additionalJustification &&
              row('Justification', request.values.additionalJustification)}
            {request.values.otherReason && row('Other reason', request.values.otherReason)}
            {request.values.destination && row('Destination', request.values.destination)}
            {request.values.travelStartDate && row('Travel start', request.values.travelStartDate)}
            {request.values.travelEndDate && row('Travel end', request.values.travelEndDate)}
            {request.values.vendor && row('Vendor', request.values.vendor)}
            {request.values.vendorReason && row('Vendor reason', request.values.vendorReason)}
          </tbody>
        </table>
      </section>

      <ApprovalProgress events={request.events} users={users} />

      {isAssignedApprover && isSubmitted && (
        <ApprovalActions request={request} onUpdate={onUpdate} />
      )}

      <RequestHistory events={request.events} users={users} />
    </article>
  );
}
