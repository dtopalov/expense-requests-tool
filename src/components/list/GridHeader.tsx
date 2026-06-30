export type SortDirection = 'asc' | 'desc' | null;

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface GridHeaderProps {
  columns: Column[];
  sortKey: string | null;
  sortDir: SortDirection;
  onSort: (key: string) => void;
  activeCell: [number, number];
}

export function GridHeader({
  columns,
  sortKey,
  sortDir,
  activeCell
}: GridHeaderProps): React.ReactElement {
  const [activeRow, activeCol] = activeCell;

  return (
    <tr className="grid__row grid__row--header">
      {columns.map((col, i) => {
        const isActive = activeRow === 0 && activeCol === i;
        const isSorted = col.sortable && sortKey === col.key && sortDir !== null;
        const ariaSort = col.sortable
          ? sortKey === col.key && sortDir !== null
            ? sortDir === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
          : undefined;

        return (
          <th
            key={col.key}
            scope="col"
            aria-sort={ariaSort}
            className={`grid__cell grid__header${col.sortable ? ' grid__header--sortable' : ''}`}
            tabIndex={isActive ? 0 : -1}
            data-grid-row={0}
            data-grid-col={i}
            data-sort-key={col.sortable ? col.key : undefined}
          >
            {col.label}
            {isSorted && (
              <span aria-hidden="true" className="grid__sort-icon">
                {sortDir === 'asc' ? ' ▲' : ' ▼'}
              </span>
            )}
          </th>
        );
      })}
      {/* Details column header — not sortable, still focusable for arrow nav */}
      <th
        scope="col"
        className="grid__cell grid__header"
        tabIndex={activeRow === 0 && activeCol === columns.length ? 0 : -1}
        data-grid-row={0}
        data-grid-col={columns.length}
      >
        Details
      </th>
    </tr>
  );
}
