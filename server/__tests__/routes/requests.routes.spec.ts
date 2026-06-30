import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.ts';

const app = createApp();
const ALICE = { 'X-User-Id': 'u_alice' };
const BOB = { 'X-User-Id': 'u_bob' };
const CAROL = { 'X-User-Id': 'u_carol' };
const DAVE = { 'X-User-Id': 'u_dave' };

const validDraft = {
  expenseType: 'Meal',
  amountCents: 5000,
  description: 'Test meal expense',
  billable: false
};

describe('GET /api/requests', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(401);
  });

  it('returns list with status field', async () => {
    const res = await request(app).get('/api/requests').set(ALICE);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const req = res.body[0];
    expect(req).toHaveProperty('status');
    expect(req).toHaveProperty('id');
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/requests?status=Draft').set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.every((r: { status: string }) => r.status === 'Draft')).toBe(true);
  });

  it('filters by minAmountCents', async () => {
    const all = await request(app).get('/api/requests').set(ALICE);
    const maxCents: number = Math.max(...all.body.map((r: { values: { amountCents?: number } }) => r.values.amountCents ?? 0));

    const res = await request(app).get(`/api/requests?minAmountCents=${maxCents}`).set(ALICE);
    expect(res.status).toBe(200);
    expect(
      res.body.every((r: { values: { amountCents?: number } }) => (r.values.amountCents ?? 0) >= maxCents)
    ).toBe(true);
  });

  it('filters by maxAmountCents', async () => {
    const res = await request(app).get('/api/requests?maxAmountCents=0').set(ALICE);
    expect(res.status).toBe(200);
    expect(
      res.body.every((r: { values: { amountCents?: number } }) => (r.values.amountCents ?? 0) <= 0)
    ).toBe(true);
  });

  it('ignores negative minAmountCents / maxAmountCents', async () => {
    const res = await request(app).get('/api/requests?minAmountCents=-100').set(ALICE);
    expect(res.status).toBe(200);
    // Negative value is ignored — same result as no filter
    const all = await request(app).get('/api/requests').set(ALICE);
    expect(res.body.length).toBe(all.body.length);
  });

  it('sorts by amountCents ascending via sortKey+sortDir params', async () => {
    const res = await request(app)
      .get('/api/requests?sortKey=amountCents&sortDir=asc')
      .set(ALICE);
    expect(res.status).toBe(200);
    const amounts: number[] = res.body.map(
      (r: { values: { amountCents?: number } }) => r.values.amountCents ?? 0
    );
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
  });

  it('sorts by amountCents descending via sortKey+sortDir params', async () => {
    const res = await request(app)
      .get('/api/requests?sortKey=amountCents&sortDir=desc')
      .set(ALICE);
    expect(res.status).toBe(200);
    const amounts: number[] = res.body.map(
      (r: { values: { amountCents?: number } }) => r.values.amountCents ?? 0
    );
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('ignores invalid sortDir value', async () => {
    const res = await request(app).get('/api/requests?sortKey=id&sortDir=invalid').set(ALICE);
    expect(res.status).toBe(200);
    // sortDir is ignored — returns same count as unsorted
    const all = await request(app).get('/api/requests').set(ALICE);
    expect(res.body.length).toBe(all.body.length);
  });
});

describe('GET /api/requests/:id', () => {
  it('returns 404 for unknown request', async () => {
    const res = await request(app).get('/api/requests/REQ-NOPE').set(ALICE);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('returns existing request with events', async () => {
    const res = await request(app).get('/api/requests/REQ-001').set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('REQ-001');
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});

describe('POST /api/requests', () => {
  it('creates a draft request', async () => {
    const res = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Draft');
    expect(res.body.requesterId).toBe('u_alice');
  });

  it('does not validate on draft creation', async () => {
    const res = await request(app).post('/api/requests').set(ALICE).send({});
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});

describe('PATCH /api/requests/:id', () => {
  it('updates a draft', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    const res = await request(app)
      .patch(`/api/requests/${id}`)
      .set(ALICE)
      .send({ ...validDraft, description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.values.description).toBe('Updated description');
  });

  it('returns 403 when non-owner tries to edit', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    const res = await request(app).patch(`/api/requests/${id}`).set(BOB).send(validDraft);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/requests/:id/submit', () => {
  it('submits a valid draft', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    const res = await request(app).post(`/api/requests/${id}/submit`).set(ALICE);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Submitted');
  });

  it('returns 400 with field errors when values are empty', async () => {
    // Create a draft with valid values, then clear them via PATCH
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;

    await request(app).patch(`/api/requests/${id}`).set(ALICE).send({});

    const res = await request(app).post(`/api/requests/${id}/submit`).set(ALICE);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
    expect(res.body.fields).toBeDefined();
  });

  it('returns 403 when non-owner tries to submit', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    const res = await request(app).post(`/api/requests/${id}/submit`).set(BOB);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/requests/:id/approve', () => {
  async function createSubmitted(): Promise<string> {
    const create = await request(app).post('/api/requests').set(DAVE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    await request(app).post(`/api/requests/${id}/submit`).set(DAVE);
    return id;
  }

  it('approves when correct approver acts', async () => {
    const id = await createSubmitted();
    const res = await request(app)
      .post(`/api/requests/${id}/approve`)
      .set(BOB)
      .send({ comment: 'LGTM' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Approved');
  });

  it('returns 403 when non-approver tries to approve', async () => {
    const id = await createSubmitted();
    const res = await request(app).post(`/api/requests/${id}/approve`).set(CAROL).send({});
    expect(res.status).toBe(403);
  });
});

describe('POST /api/requests/:id/approve (multi-step chain)', () => {
  const largeDraft = {
    expenseType: 'Equipment',
    amountCents: 150000,
    description: 'Standing desk and monitor',
    billable: false,
    additionalJustification: 'Ergonomic setup required'
  };

  async function createSubmittedLarge(): Promise<string> {
    const create = await request(app).post('/api/requests').set(DAVE).send(largeDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    const submit = await request(app).post(`/api/requests/${id}/submit`).set(DAVE);
    expect(submit.status).toBe(200);
    // Dave's manager (Bob) is first; finance (Carol) is second
    expect(submit.body.approverId).toBe('u_bob');
    return id;
  }

  it('requires manager then finance to fully approve a >= $1,000 request', async () => {
    const id = await createSubmittedLarge();

    const step = await request(app).post(`/api/requests/${id}/approve`).set(BOB).send({});
    expect(step.status).toBe(200);
    expect(step.body.status).toBe('Submitted');
    expect(step.body.approverId).toBe('u_carol');

    const final = await request(app).post(`/api/requests/${id}/approve`).set(CAROL).send({});
    expect(final.status).toBe(200);
    expect(final.body.status).toBe('Approved');
  });

  it('rejects an out-of-order approval (finance before manager)', async () => {
    const id = await createSubmittedLarge();
    const res = await request(app).post(`/api/requests/${id}/approve`).set(CAROL).send({});
    expect(res.status).toBe(403);
  });
});

describe('POST /api/requests/:id/reject', () => {
  it('rejects a submitted request', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    await request(app).post(`/api/requests/${id}/submit`).set(ALICE);
    const res = await request(app)
      .post(`/api/requests/${id}/reject`)
      .set(BOB)
      .send({ comment: 'Denied' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Rejected');
  });

  it('returns 400 when comment is missing', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    const id: string = create.body.id;
    await request(app).post(`/api/requests/${id}/submit`).set(ALICE);
    const res = await request(app)
      .post(`/api/requests/${id}/reject`)
      .set(BOB)
      .send({ comment: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
    expect(res.body.fields).toHaveProperty('comment');
  });
});

describe('POST /api/requests/:id/resubmit', () => {
  it('resubmits a rejected request', async () => {
    const create = await request(app).post('/api/requests').set(ALICE).send(validDraft);
    expect(create.status).toBe(201);
    const id: string = create.body.id;
    await request(app).post(`/api/requests/${id}/submit`).set(ALICE);
    await request(app).post(`/api/requests/${id}/reject`).set(BOB).send({ comment: 'Denied' });
    const res = await request(app)
      .post(`/api/requests/${id}/resubmit`)
      .set(ALICE)
      .send({ values: validDraft, note: 'Fixed it' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Submitted');
  });
});
