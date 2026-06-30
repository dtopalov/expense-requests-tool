import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vitest';
import { mockFetch, resetRequestStore } from './mock-fetch.ts';

// react-router v7 calls new Request(url, { signal }) using undici's Request class
// but the AbortController in jsdom produces a jsdom AbortSignal, not an undici AbortSignal.
// This causes an unhandled rejection after programmatic navigation in tests.
// Suppress it — it does not affect test correctness.
process.on('unhandledRejection', reason => {
  if (
    reason instanceof TypeError &&
    (reason.message.includes('AbortSignal') || reason.message.includes('signal'))
  ) {
    return;
  }
  throw reason;
});

beforeEach(() => {
  resetRequestStore();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});
