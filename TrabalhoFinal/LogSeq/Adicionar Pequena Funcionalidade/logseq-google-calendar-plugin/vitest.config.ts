import { defineConfig } from 'vitest/config';

// Vitest config: run tests in a plain Node environment and override Vite
// plugins so project dev plugins (like vite-plugin-logseq) aren't executed
// during the test run.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  // Force an empty plugins array to avoid loading dev plugins from
  // vite.config.ts (vite-plugin-logseq currently errors in test env).
  plugins: [],
});
