import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { ExpenseRequest } from '../../models/request.ts';
import { GridHeader } from './GridHeader.tsx';
import { RequestRow } from './RequestRow.tsx';
import type { SortDirection } from './GridHeader.tsx';

const DATA_COLUMNS = [
  { key: 'id', label: 'ID', sortable: true, width: '120px' },
  { key: 'expenseType', label: 'Type', sortable: true, width: '130px' },
  { key: 'amountCents', label: 'Amount', sortable: true, width: '110px' },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '110px' }
];

// Last col is the Details action column
const TOTAL_COLS = DATA_COLUMNS.length + 1;
const DETAILS_COL = DATA_COLUMNS.length;

interface RequestGridProps {
  requests: ExpenseRequest[];
  sortKey: string | null;
  sortDir: SortDirection;
  onSort: (key: string) => void;
}

export function RequestGrid({
  requests,
  sortKey,
  sortDir,
  onSort
}: RequestGridProps): React.ReactElement {
  const navigate = useNavigate();
  // [row, col]: row 0 = header, rows 1..N = data rows
  const [activeCell, setActiveCell] = useState<[number, number]>([0, 0]);
  const gridRef = useRef<HTMLTableElement>(null);
  // True when a keyboard nav triggered setActiveCell — useEffect will programmatically focus
  const keyNavPending = useRef(false);

  const totalRows = requests.length + 1; // header + data rows

  // After keyboard nav, focus the target element once the DOM has updated tabIndex
  useEffect(() => {
    if (!keyNavPending.current) return;
    keyNavPending.current = false;
    const [r, c] = activeCell;
    const el = gridRef.current?.querySelector<HTMLElement>(
      `[data-grid-row="${r}"][data-grid-col="${c}"]`
    );
    el?.focus();
  }, [activeCell]);

  function handleFocus(e: React.FocusEvent): void {
    const target = e.target as HTMLElement;
    const r = Number(target.dataset['gridRow']);
    const c = Number(target.dataset['gridCol']);

    if (!isNaN(r) && !isNaN(c) && target.dataset['gridRow'] !== undefined) {
      // Use functional update so React bails out if the same cell re-fires focus
      setActiveCell(prev => (prev[0] === r && prev[1] === c ? prev : [r, c]));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    const [row, col] = activeCell;

    // Enter activates sortable header cells (Space is reserved for grid selection per W3C APG)
    if (e.key === 'Enter' && row === 0 && col < DETAILS_COL) {
      e.preventDefault();
      const colKey = DATA_COLUMNS[col]?.key;
      if (colKey) onSort(colKey);
      return;
    }

    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowDown':
        newRow = Math.min(row + 1, totalRows - 1);
        break;
      case 'ArrowUp':
        newRow = Math.max(row - 1, 0);
        break;
      case 'ArrowRight':
        // From details col, do nothing; otherwise advance
        if (col < DETAILS_COL) newCol = col + 1;
        break;
      case 'ArrowLeft':
        newCol = Math.max(col - 1, 0);
        break;
      default:
        return;
    }

    if (newRow === row && newCol === col) return;
    e.preventDefault();
    keyNavPending.current = true;
    setActiveCell([newRow, newCol]);
  }

  // Delegated click: sort via data-sort-key, navigate via data-navigate-id
  function handleClick(e: React.MouseEvent): void {
    const sortTarget = (e.target as HTMLElement).closest<HTMLElement>('[data-sort-key]');
    if (sortTarget?.dataset['sortKey']) {
      onSort(sortTarget.dataset['sortKey']);
      return;
    }

    const navTarget = (e.target as HTMLElement).closest<HTMLElement>('[data-navigate-id]');
    if (navTarget?.dataset['navigateId']) {
      void navigate(`/${navTarget.dataset['navigateId']}`);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="grid__empty" role="status">
        No expense requests found.
      </div>
    );
  }

  return (
    <div className="grid-wrap">
      <table
        ref={gridRef}
        role="grid"
        aria-rowcount={totalRows}
        aria-colcount={TOTAL_COLS}
        aria-label="Expense requests"
        className="grid"
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        <colgroup>
          {DATA_COLUMNS.map(col => (
            <col key={col.key} style={col.width ? { width: col.width } : undefined} />
          ))}
          <col style={{ width: '90px' }} />
        </colgroup>
        <thead>
          <GridHeader
            columns={DATA_COLUMNS}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
            activeCell={activeCell}
          />
        </thead>
        <tbody>
          {requests.map((req, i) => (
            <RequestRow
              key={req.id}
              request={req}
              gridRow={i + 1}
              totalCols={TOTAL_COLS}
              activeCell={activeCell}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
