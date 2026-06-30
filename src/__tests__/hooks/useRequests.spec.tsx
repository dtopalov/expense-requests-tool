import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRequests } from '../../hooks/useRequests.ts';
import { setCurrentUserId } from '../../api/client.ts';
import { setFetchOverride } from '../../test/mock-fetch.ts';

describe('useRequests', () => {
  it('loads requests on mount', async () => {
    setCurrentUserId('u_alice');
    const { result } = renderHook(() => useRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requests.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('filters by status', async () => {
    setCurrentUserId('u_alice');
    const { result } = renderHook(() => useRequests({ status: 'Draft' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.requests.every(r => r.status === 'Draft')).toBe(true);
  });

  it('sets error on fetch failure', async () => {
    setFetchOverride((url, method) => {
      if (method === 'GET' && url.pathname === '/api/requests') {
        return new Response(JSON.stringify({ error: 'INTERNAL_ERROR' }), { status: 500 });
      }
    });
    setCurrentUserId('u_alice');
    const { result } = renderHook(() => useRequests());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });
});
