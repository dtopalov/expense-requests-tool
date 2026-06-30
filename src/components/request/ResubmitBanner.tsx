import { Link } from 'react-router';
import type { ExpenseRequest } from '../../models/request.ts';

interface ResubmitBannerProps {
  request: ExpenseRequest;
}

export function ResubmitBanner({ request }: ResubmitBannerProps): React.ReactElement {
  const rejectionEvent = [...request.events].reverse().find(e => e.type === 'rejected');
  const comment = rejectionEvent?.comment;

  return (
    <div className="resubmit-banner" role="alert">
      <strong className="resubmit-banner__title">This request was rejected.</strong>
      {comment && <p className="resubmit-banner__reason">{comment}</p>}
      <Link to={`/${request.id}/edit`} className="btn btn--primary resubmit-banner__action" tabIndex={0}>
        Fix and Resubmit
      </Link>
    </div>
  );
}
