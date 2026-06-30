import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.ts';

const app = createApp();
const AUTH = { 'X-User-Id': 'u_alice' };

describe('GET /api/users', () => {
  it('returns list of users without auth', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('user objects have expected shape', async () => {
    const res = await request(app).get('/api/users').set(AUTH);
    const user = res.body[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('role');
  });
});

describe('GET /api/users/:id', () => {
  it('returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/users/u_nobody').set(AUTH);
    expect(res.status).toBe(404);
  });

  it('returns the user', async () => {
    const res = await request(app).get('/api/users/u_alice').set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('u_alice');
    expect(res.body.name).toBe('Alice Chen');
  });
});
