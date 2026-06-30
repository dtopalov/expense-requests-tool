import { useState } from 'react';
import { useRequests } from '../hooks/useRequests.ts';
import { useDebounce } from '../hooks/useDebounce.ts';
import { RequestGrid } from '../components/list/RequestGrid.tsx';
import { FilterBar, EMPTY_FILTERS } from '../components/list/FilterBar.tsx';
import type { FilterValues } from '../components/list/FilterBar.tsx';
import type { SortDirection } from '../components/list/GridHeader.tsx';

export default function RequestListPage(): React.ReactElement {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const debouncedSearch = useDebounce(filters.search, 300);

  const { requests, loading, error } = useRequests({
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
    minAmountCents: filters.minAmountCents,
    maxAmountCents: filters.maxAmountCents,
    sortKey: sortKey ?? undefined,
    sortDir: sortDir ?? undefined
  });

  function handleSort(key: string): void {
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
    <div className="page page--list">
      <h1 className="page__title">Expense Requests</h1>
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      {loading && (
        <p className="page__status" role="status">
          Loading…
        </p>
      )}
      {error && (
        <p className="page__error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <RequestGrid
          requests={requests}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
