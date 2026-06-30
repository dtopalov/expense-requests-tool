import { useState, useEffect, useCallback } from 'react';
import { fetchRequest } from '../api/requests.api.ts';
import type { ExpenseRequest } from '../models/request.ts';

interface UseRequestResult {
  request: ExpenseRequest | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRequest(id: string): UseRequestResult {
  const [request, setRequest] = useState<ExpenseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchRequest(id)
      .then(data => {
        if (!cancelled) setRequest(data);
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
  }, [id, tick]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { request, loading, error, refresh };
}
