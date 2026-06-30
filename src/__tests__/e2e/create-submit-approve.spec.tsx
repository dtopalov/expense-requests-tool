import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { ToastProvider } from '../../components/common/Toast.tsx';
import { AppShell } from '../../components/layout/AppShell.tsx';
import RequestListPage from '../../pages/RequestListPage.tsx';
import RequestCreatePage from '../../pages/RequestCreatePage.tsx';
import RequestDetailPage from '../../pages/RequestDetailPage.tsx';
import { setCurrentUserId } from '../../api/client.ts';
import { resetRequestStore } from '../../test/mock-fetch.ts';

function makeApp(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <RequestListPage /> },
          { path: 'new', element: <RequestCreatePage /> },
          { path: ':id', element: <RequestDetailPage /> }
        ]
      }
    ],
    { initialEntries: [initialPath] }
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

describe('E2E: Create → Submit → Approve flow', () => {
  beforeEach(() => {
    resetRequestStore();
    setCurrentUserId('u_alice');
  });

  it('shows the request list on load', async () => {
    render(makeApp());
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());
  });

  it('shows the new request form at /new', async () => {
    render(makeApp('/new'));
    await waitFor(() => expect(screen.getByText(/new expense request/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });
});
