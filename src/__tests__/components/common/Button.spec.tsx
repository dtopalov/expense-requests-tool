import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../components/common/Button.tsx';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('has tabIndex 0 for Safari tab support', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0');
  });

  it('allows tabIndex override', () => {
    render(<Button tabIndex={-1}>Hidden</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1');
  });

  it('applies variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--danger');
  });

  it('forwards disabled prop', () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
