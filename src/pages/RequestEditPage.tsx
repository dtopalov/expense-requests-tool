import { useParams, Navigate } from 'react-router';
import { useRequest } from '../hooks/useRequest.ts';
import { RequestForm } from '../components/request/RequestForm.tsx';
import { updateRequest, submitRequest, resubmitRequest } from '../api/requests.api.ts';
import type { RequestValues } from '../models/request.ts';
import { useCurrentUser } from '../hooks/useCurrentUser.ts';

export default function RequestEditPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { request, loading, error } = useRequest(id ?? '');
  const currentUser = useCurrentUser();

  if (loading)
    return (
      <p className="page__status" role="status">
        Loading…
      </p>
    );
  if (error)
    return (
      <p className="page__error" role="alert">
        {error}
      </p>
    );
  if (!request) return <Navigate to="/" replace />;

  if (!currentUser || request.requesterId !== currentUser.id) {
    return <Navigate to={`/${id}`} replace />;
  }

  const isDraft = request.status === 'Draft';
  const isRejected = request.status === 'Rejected';

  if (!isDraft && !isRejected) {
    return <Navigate to={`/${id}`} replace />;
  }

  async function handleSave(values: RequestValues): Promise<{ id: string }> {
    return updateRequest(request!.id, values);
  }

  async function handleSubmit(reqId: string, values: RequestValues, note?: string): Promise<void> {
    if (isRejected) {
      await resubmitRequest(reqId, values, note);
    } else {
      await submitRequest(reqId);
    }
  }

  return (
    <div className="page page--form">
      <h1 className="page__title">
        {isRejected ? 'Fix and Resubmit' : 'Edit Request'}: {request.id}
      </h1>
      <RequestForm
        mode="edit"
        resubmit={isRejected}
        initialValues={request.values}
        requestId={request.id}
        onSave={handleSave}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
