import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider } from '../../context/AuthContext.tsx';
import { ToastProvider } from '../../components/common/Toast.tsx';
import { AppShell } from '../../components/layout/AppShell.tsx';
import RequestCreatePage from '../../pages/RequestCreatePage.tsx';
import RequestDetailPage from '../../pages/RequestDetailPage.tsx';
import { setCurrentUserId } from '../../api/client.ts';
import { resetRequestStore } from '../../test/mock-fetch.ts';

function makeFormApp() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { path: 'new', element: <RequestCreatePage /> },
          { path: ':id', element: <RequestDetailPage /> }
        ]
      }
    ],
    { initialEntries: ['/new'] }
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

function makeDetailApp(requestId: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [{ path: ':id', element: <RequestDetailPage /> }]
      }
    ],
    { initialEntries: [`/${requestId}`] }
  );

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

describe('E2E: Draft save', () => {
  beforeEach(() => {
    resetRequestStore();
    setCurrentUserId('u_alice');
  });

  it('saves a draft and shows success toast', async () => {
    render(makeFormApp());
    await waitFor(() => screen.getByLabelText(/description/i));

    await userEvent.type(screen.getByLabelText(/description/i), 'My test expense');
    await userEvent.click(screen.getByRole('button', { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
    });
  });

  it('shows Edit button for own draft on detail page', async () => {
    render(makeDetailApp('REQ-001'));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^edit$/i })).toBeInTheDocument();
    });
  });
});
