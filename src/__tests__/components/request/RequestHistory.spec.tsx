import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequestHistory } from '../../../components/request/RequestHistory.tsx';
import type { RequestEvent } from '../../../models/request.ts';
import type { User } from '../../../models/user.ts';

const users: User[] = [
  { id: 'u_alice', name: 'Alice Chen', role: 'employee', managerId: 'u_bob' },
  { id: 'u_bob', name: 'Bob Martinez', role: 'manager', managerId: null }
];

const events: RequestEvent[] = [
  { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
  { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob' },
  { type: 'approved', at: '2026-06-02T09:00:00Z', actorId: 'u_bob', comment: 'Looks good' }
];

describe('RequestHistory', () => {
  it('renders all events', () => {
    render(<RequestHistory events={events} users={users} />);
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('shows actor names', () => {
    render(<RequestHistory events={events} users={users} />);
    const aliceRefs = screen.getAllByText(/Alice Chen/);
    expect(aliceRefs.length).toBeGreaterThan(0);
    const bobRefs = screen.getAllByText(/Bob Martinez/);
    expect(bobRefs.length).toBeGreaterThan(0);
  });

  it('shows approval comment', () => {
    render(<RequestHistory events={events} users={users} />);
    expect(screen.getByText('Looks good')).toBeInTheDocument();
  });

  it('shows assignee on submitted event', () => {
    render(<RequestHistory events={events} users={users} />);
    expect(screen.getByText(/Assigned to: Bob Martinez/)).toBeInTheDocument();
  });

  it('labels an intermediate step approval', () => {
    const stepEvents: RequestEvent[] = [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob' },
      { type: 'step-approved', at: '2026-06-01T02:00:00Z', actorId: 'u_bob' }
    ];
    render(<RequestHistory events={stepEvents} users={users} />);
    expect(screen.getByText('Approved (step)')).toBeInTheDocument();
  });
});
