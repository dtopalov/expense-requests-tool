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

const rejectedRequest: ExpenseRequest = {
  id: 'REQ-REJECTED',
  requesterId: 'u_alice',
  values: {
    expenseType: 'Meal',
    amountCents: 5000,
    description: 'Rejected expense',
    billable: false
  },
  events: [
    { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
    { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob' },
    { type: 'rejected', at: '2026-06-01T02:00:00Z', actorId: 'u_bob', comment: 'Denied' }
  ],
  status: 'Rejected',
  approverId: undefined
};

function makeApp() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [{ path: ':id', element: <RequestDetailPage /> }]
      }
    ],
    { initialEntries: ['/REQ-REJECTED'] }
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

describe('E2E: Resubmit flow', () => {
  beforeEach(() => {
    resetRequestStore();
    addToStore(rejectedRequest);
    setCurrentUserId('u_alice');
  });

  it('shows resubmit banner for rejected request owned by current user', async () => {
    render(makeApp());
    await waitFor(() => expect(screen.getByText(/this request was rejected/i)).toBeInTheDocument());
    expect(screen.getAllByText('Denied').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /fix and resubmit/i })).toBeInTheDocument();
  });

  it('Fix and Resubmit link has tabIndex 0 for Safari tab support', async () => {
    render(makeApp());
    await waitFor(() => expect(screen.getByRole('link', { name: /fix and resubmit/i })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /fix and resubmit/i })).toHaveAttribute('tabindex', '0');
  });
});
