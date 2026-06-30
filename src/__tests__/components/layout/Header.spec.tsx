import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Header } from '../../../components/layout/Header.tsx';
import type { User } from '../../../models/user.ts';

const alice: User = { id: 'u_alice', name: 'Alice', role: 'employee', managerId: 'u_bob' };

vi.mock('../../../context/AuthContext.tsx', () => ({
  useAuth: () => ({
    currentUser: alice,
    users: [alice],
    setCurrentUser: () => {},
    loading: false
  })
}));

function renderHeader(pathname = '/') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('renders the logo link', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /expense requests/i })).toBeInTheDocument();
  });

  it('logo link has tabIndex 0 for Safari tab support', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /expense requests/i })).toHaveAttribute('tabindex', '0');
  });

  it('shows New Request link on non-new pages', () => {
    renderHeader('/');
    expect(screen.getByRole('link', { name: /new request/i })).toBeInTheDocument();
  });

  it('New Request link has tabIndex 0 for Safari tab support', () => {
    renderHeader('/');
    expect(screen.getByRole('link', { name: /new request/i })).toHaveAttribute('tabindex', '0');
  });

  it('hides New Request link on /new page', () => {
    renderHeader('/new');
    expect(screen.queryByRole('link', { name: /new request/i })).not.toBeInTheDocument();
  });
});
