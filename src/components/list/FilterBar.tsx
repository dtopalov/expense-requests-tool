import { useState } from 'react';
import { REQUEST_STATUSES } from '../../models/constants.ts';
import { SelectField } from '../form/SelectField.tsx';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...REQUEST_STATUSES.map(s => ({ value: s, label: s }))
];

export interface FilterValues {
  search: string;
  status: string;
  minAmountCents?: number;
  maxAmountCents?: number;
}

export const EMPTY_FILTERS: FilterValues = { search: '', status: '' };

interface FilterBarProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps): React.ReactElement {
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== '' ||
    minInput !== '' ||
    maxInput !== '';

  function handleAmountApply(): void {
    const min = minInput === '' ? undefined : parseFloat(minInput);
    const max = maxInput === '' ? undefined : parseFloat(maxInput);

    if (min !== undefined && min < 0) {
      setAmountError('Minimum amount must be 0 or greater.');
      return;
    }
    if (max !== undefined && max < 0) {
      setAmountError('Maximum amount must be 0 or greater.');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setAmountError('Minimum must not exceed maximum.');
      return;
    }

    setAmountError(null);
    onFiltersChange({
      ...filters,
      minAmountCents: min !== undefined ? Math.round(min * 100) : undefined,
      maxAmountCents: max !== undefined ? Math.round(max * 100) : undefined
    });
  }

  function handleClearAll(): void {
    setMinInput('');
    setMaxInput('');
    setAmountError(null);
    onFiltersChange(EMPTY_FILTERS);
  }

  return (
    <div className="filter-bar" role="search" aria-label="Filter expense requests">
      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="filter-search">
          Search
        </label>
        <input
          id="filter-search"
          type="search"
          className="filter-bar__input"
          value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search by ID, description, or type…"
          aria-label="Search expense requests"
          tabIndex={0}
        />
      </div>

      <div className="filter-bar__divider" aria-hidden="true" />

      <SelectField
        id="filter-status"
        label="Status"
        value={filters.status}
        onChange={value => onFiltersChange({ ...filters, status: value })}
        options={STATUS_OPTIONS}
      />

      <div className="filter-bar__divider" aria-hidden="true" />

      <div
        className="filter-bar__group filter-bar__group--amount"
        role="group"
        aria-label="Filter by amount"
      >
        <span className="filter-bar__label">Amount ($)</span>
        <div className="filter-bar__amount-row">
          <label className="filter-bar__amount-label" htmlFor="filter-amount-min">
            Min
          </label>
          <input
            id="filter-amount-min"
            type="number"
            min="0"
            step="0.01"
            className="filter-bar__input filter-bar__input--amount"
            value={minInput}
            onChange={e => setMinInput(e.target.value)}
            placeholder="0.00"
            aria-label="Minimum amount"
            tabIndex={0}
          />
          <label className="filter-bar__amount-label" htmlFor="filter-amount-max">
            Max
          </label>
          <input
            id="filter-amount-max"
            type="number"
            min="0"
            step="0.01"
            className="filter-bar__input filter-bar__input--amount"
            value={maxInput}
            onChange={e => setMaxInput(e.target.value)}
            placeholder="—"
            aria-label="Maximum amount"
            tabIndex={0}
          />
          <button
            type="button"
            className="btn btn--secondary filter-bar__amount-apply"
            tabIndex={0}
            onClick={handleAmountApply}
            aria-label="Apply amount filter"
          >
            Apply
          </button>
        </div>
        {amountError && (
          <p className="filter-bar__amount-error" role="alert">
            {amountError}
          </p>
        )}
      </div>

      <div className="filter-bar__divider" aria-hidden="true" />

      <button
        type="button"
        className="btn btn--secondary filter-bar__clear"
        tabIndex={0}
        onClick={handleClearAll}
        disabled={!hasActiveFilters}
        aria-label="Clear all filters"
      >
        <span aria-hidden="true">×</span> Clear
      </button>
    </div>
  );
}
