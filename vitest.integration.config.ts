import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests only.
 * Run: npm run test:integration
 */
export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: false,
    environment: 'node',
  },
});
