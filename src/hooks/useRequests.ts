import { useState, useEffect, useCallback } from 'react';
import { fetchRequests } from '../api/requests.api.ts';
import type { ExpenseRequest } from '../models/request.ts';
import type { ListQuery } from '../api/requests.api.ts';

interface UseRequestsResult {
  requests: ExpenseRequest[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRequests(query: ListQuery = {}): UseRequestsResult {
  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const { status, search, requesterId, minAmountCents, maxAmountCents, sortKey, sortDir } = query;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchRequests({ status, search, requesterId, minAmountCents, maxAmountCents, sortKey, sortDir })
      .then(data => {
        if (!cancelled) setRequests(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, search, requesterId, minAmountCents, maxAmountCents, sortKey, sortDir, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { requests, loading, error, refresh };
}
