import type { RequestStatus } from '../../models/constants.ts';

interface StatusBadgeProps {
  status: RequestStatus;
  progress?: string;
}

export function StatusBadge({ status, progress }: StatusBadgeProps): React.ReactElement {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {status}
      {progress && <span className="status-badge__progress"> {progress}</span>}
    </span>
  );
}
