import { RequestForm } from '../components/request/RequestForm.tsx';
import { createRequest, submitRequest } from '../api/requests.api.ts';
import type { RequestValues } from '../models/request.ts';

export default function RequestCreatePage(): React.ReactElement {
  async function handleSave(values: RequestValues): Promise<{ id: string }> {
    return createRequest(values);
  }

  async function handleSubmit(id: string): Promise<void> {
    await submitRequest(id);
  }

  return (
    <div className="page page--form">
      <h1 className="page__title">New Expense Request</h1>
      <RequestForm mode="create" onSave={handleSave} onSubmit={handleSubmit} />
    </div>
  );
}
