import { Link, useLocation } from 'react-router';
import { UserPicker } from './UserPicker.tsx';

export function Header(): React.ReactElement {
  const { pathname } = useLocation();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Link to="/" className="app-header__logo" tabIndex={0}>
          Expense Requests
        </Link>
      </div>
      {pathname !== '/new' && (
        <nav className="app-header__nav">
          <Link to="/new" className="app-header__link btn btn--primary" tabIndex={0}>
            New Request
          </Link>
        </nav>
      )}
      <UserPicker />
    </header>
  );
}
