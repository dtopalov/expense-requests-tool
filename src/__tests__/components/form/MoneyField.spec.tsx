import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyField } from '../../../components/form/MoneyField.tsx';

describe('MoneyField', () => {
  it('renders label and input', () => {
    render(<MoneyField id="amount" label="Amount" valueCents={undefined} onChange={() => {}} />);
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
  });

  it('displays formatted value from cents', () => {
    render(<MoneyField id="amount" label="Amount" valueCents={5000} onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('50.00');
  });

  it('calls onChange with cents on input', async () => {
    const onChange = vi.fn();
    render(<MoneyField id="amount" label="Amount" valueCents={undefined} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '12.50');
    expect(onChange).toHaveBeenCalledWith(1250);
  });

  it('calls onChange with undefined for empty input', async () => {
    const onChange = vi.fn();
    render(<MoneyField id="amount" label="Amount" valueCents={5000} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows error message', () => {
    render(
      <MoneyField
        id="amount"
        label="Amount"
        valueCents={undefined}
        onChange={() => {}}
        error="Amount is required"
      />
    );
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('shows local invalid error when non-empty input does not parse to a valid amount', async () => {
    const onChange = vi.fn();
    render(<MoneyField id="amount" label="Amount" valueCents={undefined} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalledWith(expect.any(Number));
  });

  it('clears invalid error when user corrects the input', async () => {
    const onChange = vi.fn();
    render(<MoneyField id="amount" label="Amount" valueCents={undefined} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    expect(screen.getByText('Enter a valid amount')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, '10.00');
    await userEvent.tab();
    expect(screen.queryByText('Enter a valid amount')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(1000);
  });
});
