import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['src/__tests__/**/*.spec.tsx', 'src/__tests__/**/*.spec.ts'],
          setupFiles: ['src/test/setup.ts'],
          globals: true
        }
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/__tests__/**/*.spec.ts'],
          globals: true
        }
      }
    ]
  }
});
