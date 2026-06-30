import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApprovalProgress } from '../../../components/request/ApprovalProgress.tsx';
import type { RequestEvent } from '../../../models/request.ts';
import type { User } from '../../../models/user.ts';

const users: User[] = [
  { id: 'u_alice', name: 'Alice Chen', role: 'employee', managerId: 'u_bob' },
  { id: 'u_bob', name: 'Bob Martinez', role: 'manager', managerId: null },
  { id: 'u_carol', name: 'Carol Finance', role: 'finance', managerId: null }
];

const chain = ['u_bob', 'u_carol'];

function base(extra: RequestEvent[]): RequestEvent[] {
  return [
    { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
    { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob', approverChain: chain },
    ...extra
  ];
}

describe('ApprovalProgress', () => {
  it('renders nothing for a single-step chain', () => {
    const events: RequestEvent[] = [
      { type: 'created', at: '2026-06-01T00:00:00Z', actorId: 'u_alice' },
      { type: 'submitted', at: '2026-06-01T01:00:00Z', actorId: 'u_alice', approverId: 'u_bob', approverChain: ['u_bob'] }
    ];
    const { container } = render(<ApprovalProgress events={events} users={users} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the first approver pending and the rest waiting after submit', () => {
    render(<ApprovalProgress events={base([])} users={users} />);
    expect(screen.getByText('Approval progress (0 of 2)')).toBeInTheDocument();
    expect(screen.getByText('Bob Martinez').closest('li')).toHaveTextContent('Pending');
    expect(screen.getByText('Carol Finance').closest('li')).toHaveTextContent('Waiting');
  });

  it('marks the first approver approved and advances pending after a step approval', () => {
    const events = base([{ type: 'step-approved', at: '2026-06-01T02:00:00Z', actorId: 'u_bob' }]);
    render(<ApprovalProgress events={events} users={users} />);
    expect(screen.getByText('Bob Martinez').closest('li')).toHaveTextContent('Approved');
    expect(screen.getByText('Carol Finance').closest('li')).toHaveTextContent('Pending');
  });

  it('marks every step approved once fully approved', () => {
    const events = base([
      { type: 'step-approved', at: '2026-06-01T02:00:00Z', actorId: 'u_bob' },
      { type: 'approved', at: '2026-06-01T03:00:00Z', actorId: 'u_carol' }
    ]);
    render(<ApprovalProgress events={events} users={users} />);
    expect(screen.getByText('Approval progress (2 of 2)')).toBeInTheDocument();
    expect(screen.getByText('Bob Martinez').closest('li')).toHaveTextContent('Approved');
    expect(screen.getByText('Carol Finance').closest('li')).toHaveTextContent('Approved');
  });

  it('marks the rejecting approver as rejected', () => {
    const events = base([
      { type: 'step-approved', at: '2026-06-01T02:00:00Z', actorId: 'u_bob' },
      { type: 'rejected', at: '2026-06-01T03:00:00Z', actorId: 'u_carol', comment: 'No budget' }
    ]);
    render(<ApprovalProgress events={events} users={users} />);
    expect(screen.getByText('Carol Finance').closest('li')).toHaveTextContent('Rejected');
  });
});
