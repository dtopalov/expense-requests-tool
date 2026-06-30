import { useParams, Navigate } from 'react-router';
import { useRequest } from '../hooks/useRequest.ts';
import { useCurrentUser } from '../hooks/useCurrentUser.ts';
import { useUsers } from '../hooks/useUsers.ts';
import { RequestDetail } from '../components/request/RequestDetail.tsx';

export default function RequestDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { request, loading, error, refresh } = useRequest(id ?? '');
  const currentUser = useCurrentUser();
  const users = useUsers();

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
  if (!currentUser)
    return (
      <p className="page__status" role="status">
        Loading user…
      </p>
    );

  return (
    <div className="page page--detail">
      <RequestDetail request={request} currentUser={currentUser} users={users} onUpdate={refresh} />
    </div>
  );
}
