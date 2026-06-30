import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestGrid } from '../../../components/list/RequestGrid.tsx';
import type { ExpenseRequest } from '../../../models/request.ts';
import type { SortDirection } from '../../../components/list/GridHeader.tsx';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate
}));

const requests: ExpenseRequest[] = [
  {
    id: 'REQ-001',
    requesterId: 'u_alice',
    values: { expenseType: 'Meal', amountCents: 5000, description: 'Team lunch', billable: false },
    events: [{ type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' }],
    status: 'Draft',
    approverId: undefined
  },
  {
    id: 'REQ-002',
    requesterId: 'u_alice',
    values: { expenseType: 'Travel', amountCents: 45000, description: 'NYC trip', billable: false },
    events: [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob' }
    ],
    status: 'Submitted',
    approverId: 'u_bob'
  }
];

// Controlled wrapper that owns sort state, mirroring RequestListPage
function SortableGrid({ onSortSpy = vi.fn() }: { onSortSpy?: (key: string) => void }) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  function handleSort(key: string) {
    onSortSpy(key);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  return (
    <RequestGrid
      requests={requests}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
    />
  );
}

describe('RequestGrid', () => {
  it('renders a grid with requests', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    render(<RequestGrid requests={[]} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    expect(screen.getByText(/no expense requests/i)).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('sets aria-rowcount on grid', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '3');
  });

  it('reflects passed-in sort props — ascending', () => {
    render(
      <RequestGrid requests={requests} sortKey="amountCents" sortDir="asc" onSort={vi.fn()} />
    );
    expect(screen.getByRole('columnheader', { name: /amount/i })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
  });

  it('reflects passed-in sort props — descending', () => {
    render(
      <RequestGrid requests={requests} sortKey="amountCents" sortDir="desc" onSort={vi.fn()} />
    );
    expect(screen.getByRole('columnheader', { name: /amount/i })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
  });

  it('starts with no column sorted when sortKey is null', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    const headers = screen.getAllByRole('columnheader');
    headers.forEach(h => {
      const sort = h.getAttribute('aria-sort');
      expect(sort === 'none' || sort === null).toBe(true);
    });
  });

  it('calls onSort with column key when header is clicked', async () => {
    const onSort = vi.fn();
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={onSort} />);
    await userEvent.click(screen.getByRole('columnheader', { name: /amount/i }));
    expect(onSort).toHaveBeenCalledWith('amountCents');
  });

  it('sorts ascending on first click, descending on second, unsorted on third (via wrapper)', async () => {
    render(<SortableGrid />);
    const amountHeader = screen.getByRole('columnheader', { name: /amount/i });

    await userEvent.click(amountHeader);
    expect(amountHeader).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(amountHeader);
    expect(amountHeader).toHaveAttribute('aria-sort', 'descending');

    await userEvent.click(amountHeader);
    expect(amountHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('clicking a different column resets to ascending on that column (via wrapper)', async () => {
    render(<SortableGrid />);
    const amountHeader = screen.getByRole('columnheader', { name: /amount/i });
    const idHeader = screen.getByRole('columnheader', { name: /^id/i });

    await userEvent.click(amountHeader);
    expect(amountHeader).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(idHeader);
    expect(idHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(amountHeader).toHaveAttribute('aria-sort', 'none');
  });

  it('Enter on focused header cell calls onSort', async () => {
    const onSort = vi.fn();
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={onSort} />);
    screen.getByRole('columnheader', { name: /amount/i }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSort).toHaveBeenCalledWith('amountCents');
  });

  it('Space on focused header cell does NOT call onSort', async () => {
    const onSort = vi.fn();
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={onSort} />);
    screen.getByRole('columnheader', { name: /amount/i }).focus();
    await userEvent.keyboard(' ');
    expect(onSort).not.toHaveBeenCalled();
  });

  it('renders a View details button for each row', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    const btns = screen.getAllByRole('button', { name: /view details for/i });
    expect(btns).toHaveLength(2);
  });

  it('navigates to request detail on View button click', async () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /view details for req-001/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/REQ-001');
  });

  it('first header cell has tabIndex 0 by default', () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    expect(screen.getByRole('columnheader', { name: /^id/i })).toHaveAttribute('tabindex', '0');
  });

  it('moves focus down with ArrowDown key', async () => {
    render(<RequestGrid requests={requests} sortKey={null} sortDir={null} onSort={vi.fn()} />);
    screen.getByRole('columnheader', { name: /^id/i }).focus();
    await userEvent.keyboard('{ArrowDown}');
    // JSDOM doesn't implement context-sensitive role inheritance (td inside role=grid → gridcell),
    // so query by data attributes instead of role
    const firstRowFirstCell = document.querySelector('[data-grid-row="1"][data-grid-col="0"]');
    expect(firstRowFirstCell).toHaveAttribute('tabindex', '0');
  });
});
