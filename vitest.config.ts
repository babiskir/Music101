import { defineConfig } from 'vitest/config';

// Tests cover plain logic (notes, rhythm grading, lesson content...) and run in Node: no browser, no audio,
// no real-time waiting. Keep it that way so the whole suite finishes in a couple of seconds.
export default defineConfig({
  // vmThreads: with the current Vitest 5 + Vite 8 the default pool fails to start ('describe' without a runner).
  test: { environment: 'node', include: ['src/**/*.test.ts'], pool: 'vmThreads' },
});
