import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, EMPTY_FILTERS } from '../../../components/list/FilterBar.tsx';
import type { FilterValues } from '../../../components/list/FilterBar.tsx';

const noop = () => {};

function renderBar(
  filtersOverride: Partial<FilterValues> = {},
  onFiltersChange: (f: FilterValues) => void = noop
) {
  return render(
    <FilterBar
      filters={{ ...EMPTY_FILTERS, ...filtersOverride }}
      onFiltersChange={onFiltersChange}
    />
  );
}

describe('FilterBar', () => {
  it('renders search and status inputs', () => {
    renderBar();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  it('renders min and max amount inputs and Apply button', () => {
    renderBar();
    expect(screen.getByLabelText('Minimum amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply amount filter/i })).toBeInTheDocument();
  });

  it('calls onFiltersChange with updated search when typing', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByRole('searchbox'), 'R');
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'R' }));
  });

  it('calls onFiltersChange with updated status when selecting', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(screen.getByRole('option', { name: 'Draft' }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Draft' })
    );
  });

  it('shows current search value', () => {
    renderBar({ search: 'hello' });
    expect(screen.getByRole('searchbox')).toHaveValue('hello');
  });

  it('does NOT call onFiltersChange on amount input change — only on Apply', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByLabelText('Minimum amount'), '10');
    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it('calls onFiltersChange with cents on Apply (min only)', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByLabelText('Minimum amount'), '10');
    await userEvent.click(screen.getByRole('button', { name: /apply amount filter/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ minAmountCents: 1000, maxAmountCents: undefined })
    );
  });

  it('calls onFiltersChange with cents on Apply (max only)', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByLabelText('Maximum amount'), '25.50');
    await userEvent.click(screen.getByRole('button', { name: /apply amount filter/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ minAmountCents: undefined, maxAmountCents: 2550 })
    );
  });

  it('calls onFiltersChange with both min and max in cents on Apply', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByLabelText('Minimum amount'), '5');
    await userEvent.type(screen.getByLabelText('Maximum amount'), '100');
    await userEvent.click(screen.getByRole('button', { name: /apply amount filter/i }));
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ minAmountCents: 500, maxAmountCents: 10000 })
    );
  });

  it('shows error and does not call onFiltersChange when min exceeds max', async () => {
    const onFiltersChange = vi.fn();
    renderBar({}, onFiltersChange);
    await userEvent.type(screen.getByLabelText('Minimum amount'), '100');
    await userEvent.type(screen.getByLabelText('Maximum amount'), '10');
    await userEvent.click(screen.getByRole('button', { name: /apply amount filter/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/minimum must not exceed maximum/i);
    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it('Apply button has tabIndex 0', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /apply amount filter/i })).toHaveAttribute(
      'tabindex',
      '0'
    );
  });

  it('Clear button is always visible', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('Clear button is disabled when no filters are active', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeDisabled();
  });

  it('Clear button is enabled when search is active', () => {
    renderBar({ search: 'REQ' });
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeEnabled();
  });

  it('Clear button is enabled when status is active', () => {
    renderBar({ status: 'Draft' });
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeEnabled();
  });

  it('Clear button is enabled when an amount input is filled', async () => {
    renderBar();
    await userEvent.type(screen.getByLabelText('Minimum amount'), '10');
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeEnabled();
  });

  it('Clear calls onFiltersChange once with EMPTY_FILTERS and resets inputs', async () => {
    const onFiltersChange = vi.fn();
    renderBar({ search: 'REQ', status: 'Draft' }, onFiltersChange);

    await userEvent.type(screen.getByLabelText('Minimum amount'), '10');
    await userEvent.click(screen.getByRole('button', { name: /clear all filters/i }));

    expect(onFiltersChange).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).toHaveBeenCalledWith({ search: '', status: '' });
    expect(screen.getByLabelText('Minimum amount')).toHaveValue(null);
    expect(screen.getByLabelText('Maximum amount')).toHaveValue(null);
  });

  it('Clear button has tabIndex 0', () => {
    renderBar({ search: 'x' });
    expect(screen.getByRole('button', { name: /clear all filters/i })).toHaveAttribute(
      'tabindex',
      '0'
    );
  });
});
