import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vitest';
import { mockFetch, resetRequestStore } from './mock-fetch.ts';

beforeEach(() => {
  resetRequestStore();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});
