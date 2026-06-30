import { describe, it, expect } from 'vitest';
import { resolveApprovalChain, RoutingError } from '../../services/routing.service.ts';
import { makeUser, makeRequest, makeValues } from '../helpers/test-factory.ts';
import type { User } from '../../models/user.model.ts';

function makeStore(users: User[]) {
  const map = new Map(users.map(u => [u.id, u]));
  return {
    findAll: () => Array.from(map.values()),
    findById: (id: string) => map.get(id),
    findByRole: (role: string) => Array.from(map.values()).find(u => u.role === role),
    findAllByRole: (role: string) => Array.from(map.values()).filter(u => u.role === role)
  };
}

type Store = ReturnType<typeof makeStore>;

function chainIds(req: ReturnType<typeof makeRequest>, requester: User, store: Store): string[] {
  return resolveApprovalChain(req, requester, store as Store as never).map(u => u.id);
}

describe('resolveApprovalChain', () => {
  const finance = makeUser({ id: 'u_finance', role: 'finance', managerId: null });
  const manager = makeUser({ id: 'u_mgr', role: 'manager', managerId: null });
  const employee = makeUser({ id: 'u_emp', role: 'employee', managerId: 'u_mgr' });

  it('routes to manager only when amount < 100000 (single step)', () => {
    const store = makeStore([finance, manager, employee]);
    const req = makeRequest({
      requesterId: employee.id,
      values: makeValues({ amountCents: 99999 })
    });
    expect(chainIds(req, employee, store)).toEqual([manager.id]);
  });

  it('routes through manager THEN finance when amount >= 100000 (two steps)', () => {
    const store = makeStore([finance, manager, employee]);
    const req = makeRequest({
      requesterId: employee.id,
      values: makeValues({ amountCents: 100000 })
    });
    expect(chainIds(req, employee, store)).toEqual([manager.id, finance.id]);
  });

  it('routes to finance only when amount >= 100000 and employee has no manager', () => {
    const noMgr = makeUser({ id: 'u_nomgr', role: 'employee', managerId: null });
    const store = makeStore([finance, noMgr]);
    const req = makeRequest({
      requesterId: noMgr.id,
      values: makeValues({ amountCents: 150000 })
    });
    expect(chainIds(req, noMgr, store)).toEqual([finance.id]);
  });

  it('falls back to finance when employee has no manager (small amount)', () => {
    const noMgr = makeUser({ id: 'u_nomgr2', role: 'employee', managerId: null });
    const store = makeStore([finance, noMgr]);
    const req = makeRequest({
      requesterId: noMgr.id,
      values: makeValues({ amountCents: 5000 })
    });
    expect(chainIds(req, noMgr, store)).toEqual([finance.id]);
  });

  it('falls back to finance when manager is the requester', () => {
    const selfMgr = makeUser({ id: 'u_selfmgr', role: 'employee', managerId: 'u_selfmgr' });
    const store = makeStore([finance, selfMgr]);
    const req = makeRequest({
      requesterId: selfMgr.id,
      values: makeValues({ amountCents: 5000 })
    });
    expect(chainIds(req, selfMgr, store)).toEqual([finance.id]);
  });

  it('throws RoutingError when requester is the sole finance user (small amount)', () => {
    const financeEmp = makeUser({ id: 'u_fin_emp', role: 'finance', managerId: null });
    const store = makeStore([financeEmp]);
    const req = makeRequest({
      requesterId: financeEmp.id,
      values: makeValues({ amountCents: 5000 })
    });
    expect(() =>
      resolveApprovalChain(req, financeEmp, store as Store as never)
    ).toThrow(RoutingError);
  });

  it('throws RoutingError when amount >= 100000 and requester is the only finance user', () => {
    const financeEmp = makeUser({ id: 'u_fin_emp2', role: 'finance', managerId: null });
    const store = makeStore([financeEmp]);
    const req = makeRequest({
      requesterId: financeEmp.id,
      values: makeValues({ amountCents: 150000 })
    });
    expect(() =>
      resolveApprovalChain(req, financeEmp, store as Store as never)
    ).toThrow(RoutingError);
  });

  it('picks a different finance user when the first one is the requester', () => {
    const finance1 = makeUser({ id: 'u_fin1', role: 'finance', managerId: null });
    const finance2 = makeUser({ id: 'u_fin2', role: 'finance', managerId: null });
    const store = makeStore([finance1, finance2]);
    const req = makeRequest({
      requesterId: finance1.id,
      values: makeValues({ amountCents: 5000 })
    });
    expect(chainIds(req, finance1, store)).toEqual([finance2.id]);
  });
});
