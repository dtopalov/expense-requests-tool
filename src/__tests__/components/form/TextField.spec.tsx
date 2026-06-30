import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '../../../components/form/TextField.tsx';

describe('TextField', () => {
  it('renders label and input', () => {
    render(<TextField id="test" label="Name" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows required marker when required', () => {
    render(<TextField id="test" label="Name" value="" onChange={() => {}} required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('calls onChange with new value', async () => {
    const onChange = vi.fn();
    render(<TextField id="test" label="Name" value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<TextField id="test" label="Name" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('links error via aria-describedby', () => {
    render(<TextField id="test" label="Name" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'test-error');
  });

  it('sets aria-invalid when there is an error', () => {
    render(<TextField id="test" label="Name" value="" onChange={() => {}} error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
