import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestForm } from '../../../components/request/RequestForm.tsx';
import type { RequestValues } from '../../../models/request.ts';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('../../../components/common/Toast.tsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

const noop = async () => ({ id: 'REQ-001' });
const noopSubmit = async (_id: string) => {};

describe('RequestForm', () => {
  it('renders required fields', () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    expect(screen.getByLabelText(/expense type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows client field when billable is checked', async () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    expect(screen.queryByText(/^client$/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/bill to client/i));
    expect(screen.getByText(/^client/i)).toBeInTheDocument();
  });

  it('shows justification field when amount >= $1000', async () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    expect(screen.queryByLabelText(/additional justification/i)).not.toBeInTheDocument();
    const input = screen.getByLabelText(/amount/i);
    await userEvent.clear(input);
    await userEvent.type(input, '1000.00');
    await userEvent.tab();
    expect(screen.getByLabelText(/additional justification/i)).toBeInTheDocument();
  });

  it('disables submit button when form is empty', () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    expect(screen.getByRole('button', { name: /submit for approval/i })).toBeDisabled();
  });

  it('shows Other reason field when type is Other', async () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /expense type/i }));
    await userEvent.click(screen.getByText('Other'));
    expect(screen.getByLabelText(/reason for other/i)).toBeInTheDocument();
  });

  it('shows travel fields when type is Travel', async () => {
    render(<RequestForm mode="create" onSave={noop} onSubmit={noopSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /expense type/i }));
    await userEvent.click(screen.getByText('Travel'));
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
  });

  it('does not show the resubmit note field outside resubmit mode', () => {
    render(<RequestForm mode="edit" requestId="REQ-001" onSave={noop} onSubmit={noopSubmit} />);
    expect(screen.queryByLabelText(/what did you fix/i)).not.toBeInTheDocument();
  });

  it('forwards the edited values and resubmit note to onSubmit', async () => {
    const onSubmit = vi.fn(async (_id: string, _values: RequestValues, _note?: string) => {});
    const initialValues: RequestValues = {
      description: 'Rejected desc',
      amountCents: 5000,
      expenseType: 'Meal',
      billable: false
    };
    render(
      <RequestForm
        mode="edit"
        resubmit
        requestId="REQ-001"
        initialValues={initialValues}
        onSave={noop}
        onSubmit={onSubmit}
      />
    );
    await userEvent.type(screen.getByLabelText(/what did you fix/i), 'Corrected the amount');
    await userEvent.click(screen.getByRole('button', { name: /submit for approval/i }));
    expect(onSubmit).toHaveBeenCalledWith('REQ-001', initialValues, 'Corrected the amount');
  });

  it('populates initial values in edit mode', () => {
    render(
      <RequestForm
        mode="edit"
        requestId="REQ-001"
        initialValues={{
          description: 'Initial desc',
          amountCents: 5000,
          expenseType: 'Meal',
          billable: false
        }}
        onSave={noop}
        onSubmit={noopSubmit}
      />
    );
    expect(screen.getByDisplayValue('Initial desc')).toBeInTheDocument();
  });
});
