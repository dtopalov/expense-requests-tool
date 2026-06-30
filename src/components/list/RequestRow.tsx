import type { ExpenseRequest } from '../../models/request.ts';
import { deriveApprovalProgress } from '../../models/request.ts';
import { StatusBadge } from './StatusBadge.tsx';

function formatCents(cents: number | undefined): string {
  if (cents === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

interface RequestRowProps {
  request: ExpenseRequest;
  gridRow: number; // row index in the [row,col] system (header=0, first data row=1, …)
  totalCols: number;
  activeCell: [number, number];
}

export function RequestRow({
  request,
  gridRow,
  totalCols,
  activeCell
}: RequestRowProps): React.ReactElement {
  const [activeRow, activeCol] = activeCell;
  const detailsCol = totalCols - 1;

  const { chain, completed } = deriveApprovalProgress(request.events);
  const progress =
    request.status === 'Submitted' && chain.length >= 2
      ? `${completed}/${chain.length}`
      : undefined;

  const dataCells: [number, React.ReactNode][] = [
    [0, request.id],
    [1, request.values.expenseType ?? '—'],
    [2, formatCents(request.values.amountCents)],
    [3, request.values.description ?? '—'],
    [4, <StatusBadge key="status" status={request.status} progress={progress} />]
  ];

  return (
    <tr className="grid__row">
      {dataCells.map(([col, content]) => (
        <td
          key={col}
          className="grid__cell"
          tabIndex={activeRow === gridRow && activeCol === col ? 0 : -1}
          data-grid-row={gridRow}
          data-grid-col={col}
        >
          {content}
        </td>
      ))}
      <td className="grid__cell grid__cell--action">
        <button
          type="button"
          className="grid__details-btn"
          tabIndex={activeRow === gridRow && activeCol === detailsCol ? 0 : -1}
          data-grid-row={gridRow}
          data-grid-col={detailsCol}
          data-navigate-id={request.id}
          aria-label={`View details for ${request.id}`}
        >
          View
        </button>
      </td>
    </tr>
  );
}
