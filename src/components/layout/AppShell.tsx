import { Outlet } from 'react-router';
import { Header } from './Header.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export function AppShell(): React.ReactElement {
  const { loading } = useAuth();

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link" tabIndex={0}>
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="app-shell__main">
        {loading ? (
          <p className="page__status" role="status">
            Loading…
          </p>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
