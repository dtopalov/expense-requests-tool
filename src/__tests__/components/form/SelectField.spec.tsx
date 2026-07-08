import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectField } from '../../../components/form/SelectField.tsx';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' }
];

describe('SelectField', () => {
  it('renders trigger with placeholder when no value', () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    expect(screen.getByText('Select…')).toBeInTheDocument();
  });

  it('shows selected option label', () => {
    render(
      <SelectField id="sel" label="Pick one" value="b" onChange={() => {}} options={options} />
    );
    expect(screen.getByRole('button')).toHaveTextContent('Option B');
  });

  it('opens list on click', async () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('calls onChange when option clicked', async () => {
    const onChange = vi.fn();
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={onChange} options={options} />
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('closes on Escape', async () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates options with arrow keys', async () => {
    const onChange = vi.fn();
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={onChange} options={options} />
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(
      <SelectField
        id="sel"
        label="Pick one"
        value=""
        onChange={() => {}}
        options={options}
        error="Required"
      />
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('sets aria-expanded when open', async () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes list when focus leaves the component (Tab out)', async () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // fireEvent.blur on the container simulates focus leaving via Tab;
    // relatedTarget=document.body means focus went outside the component
    const container = btn.closest('.field') as HTMLElement;
    fireEvent.blur(container, { relatedTarget: document.body });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on outside click without stealing focus back to the trigger', async () => {
    render(
      <>
        <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
        <button type="button">Outside</button>
      </>
    );
    const trigger = screen.getByRole('button', { name: /Pick one/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();
    fireEvent.mouseDown(outside);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).not.toHaveFocus();
    expect(outside).toHaveFocus();
  });

  it('trigger button has tabIndex 0 for Safari tab support', () => {
    render(
      <SelectField id="sel" label="Pick one" value="" onChange={() => {}} options={options} />
    );
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('accepts ReactNode label and uses ariaLabel for the listbox', async () => {
    render(
      <SelectField
        id="sel"
        label={<span>Icon</span>}
        ariaLabel="Pick one"
        value=""
        onChange={() => {}}
        options={options}
      />
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'Pick one');
  });
});
