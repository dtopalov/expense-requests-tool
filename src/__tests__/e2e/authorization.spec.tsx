import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { ToastProvider } from '../../components/common/Toast.tsx';
import { AppShell } from '../../components/layout/AppShell.tsx';
import RequestDetailPage from '../../pages/RequestDetailPage.tsx';
import { setCurrentUserId } from '../../api/client.ts';
import { resetRequestStore, addToStore } from '../../test/mock-fetch.ts';
import type { ExpenseRequest } from '../../models/request.ts';

const submittedByDave: ExpenseRequest = {
  id: 'REQ-DAVE',
  requesterId: 'u_dave',
  values: {
    expenseType: 'Meal',
    amountCents: 5000,
    description: "Dave's expense",
    billable: false
  },
  events: [
    { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_dave' },
    { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_dave', approverId: 'u_bob' }
  ],
  status: 'Submitted',
  approverId: 'u_bob'
};

function makeApp(userId: string) {
  setCurrentUserId(userId);
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [{ path: ':id', element: <RequestDetailPage /> }]
      }
    ],
    { initialEntries: ['/REQ-DAVE'] }
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

describe('E2E: Authorization', () => {
  beforeEach(() => {
    resetRequestStore();
    addToStore(submittedByDave);
  });

  it('does not show Edit button to non-owners', async () => {
    render(makeApp('u_alice'));
    await waitFor(() => screen.getByText('REQ-DAVE'));
    expect(screen.queryByRole('link', { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it('does not show approval actions to non-approvers', async () => {
    render(makeApp('u_alice'));
    await waitFor(() => screen.getByText('REQ-DAVE'));
    expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it('shows approval actions to the assigned approver', async () => {
    render(makeApp('u_bob'));
    await waitFor(() => screen.getByText('REQ-DAVE'));
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument();
  });
});
