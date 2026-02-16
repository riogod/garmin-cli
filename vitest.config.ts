import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for garmin-cli.
 * Tests live in __tests__ folders.
 */
export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.ts'],
    exclude: ['node_modules', 'dist'],
    globals: false,
    environment: 'node',
  },
});
