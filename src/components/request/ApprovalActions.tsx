import { useState } from 'react';
import { Button } from '../common/Button.tsx';
import { useToast } from '../common/Toast.tsx';
import { approveRequest, rejectRequest } from '../../api/requests.api.ts';
import type { ExpenseRequest } from '../../models/request.ts';
import { deriveApprovalProgress } from '../../models/request.ts';

interface ApprovalActionsProps {
  request: ExpenseRequest;
  onUpdate: () => void;
}

export function ApprovalActions({ request, onUpdate }: ApprovalActionsProps): React.ReactElement {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const { chain, completed } = deriveApprovalProgress(request.events);
  const isMultiStep = chain.length >= 2;
  const approveLabel = isMultiStep
    ? `Approve (step ${completed + 1} of ${chain.length})`
    : 'Approve';
  const isFinalStep = completed + 1 >= chain.length;

  async function handleApprove(): Promise<void> {
    setBusy(true);

    try {
      await approveRequest(request.id, comment || undefined);

      showToast('Request approved.', 'success');
      onUpdate();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(): Promise<void> {
    if (!comment.trim()) {
      showToast('A comment is required when rejecting.', 'error');

      return;
    }

    setBusy(true);

    try {
      await rejectRequest(request.id, comment);

      showToast('Request rejected.', 'info');
      onUpdate();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="approval-actions" aria-label="Approval actions">
      <h2 className="approval-actions__title">Review</h2>
      <div className="approval-actions__comment">
        <label htmlFor="approval-comment" className="field__label">
          Comment
        </label>
        <textarea
          id="approval-comment"
          className="field__input field__input--textarea"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          placeholder="Optional comment (required for rejection)"
          aria-label="Approval or rejection comment"
        />
      </div>
      {isMultiStep && !isFinalStep && (
        <p className="approval-actions__hint">
          Your approval advances this request to the next approver.
        </p>
      )}
      <div className="approval-actions__buttons">
        <Button variant="primary" onClick={() => void handleApprove()} disabled={busy}>
          {approveLabel}
        </Button>
        <Button variant="danger" onClick={() => void handleReject()} disabled={busy}>
          Reject
        </Button>
      </div>
    </section>
  );
}
