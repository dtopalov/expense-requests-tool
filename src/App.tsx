import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { ToastProvider } from './components/common/Toast.tsx';
import { AppShell } from './components/layout/AppShell.tsx';

const RequestListPage = lazy(() => import('./pages/RequestListPage.tsx'));
const RequestCreatePage = lazy(() => import('./pages/RequestCreatePage.tsx'));
const RequestDetailPage = lazy(() => import('./pages/RequestDetailPage.tsx'));
const RequestEditPage = lazy(() => import('./pages/RequestEditPage.tsx'));

function Loading(): React.ReactElement {
  return (
    <p className="page__status" role="status">
      Loading…
    </p>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <RequestListPage />
          </Suspense>
        )
      },
      {
        path: 'new',
        element: (
          <Suspense fallback={<Loading />}>
            <RequestCreatePage />
          </Suspense>
        )
      },
      {
        path: ':id',
        element: (
          <Suspense fallback={<Loading />}>
            <RequestDetailPage />
          </Suspense>
        )
      },
      {
        path: ':id/edit',
        element: (
          <Suspense fallback={<Loading />}>
            <RequestEditPage />
          </Suspense>
        )
      }
    ]
  }
]);

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
