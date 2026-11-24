import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'node', // jsdom par fichier via `// @vitest-environment jsdom`
      setupFiles: ['src/test/setup.ts'],
      restoreMocks: true,
      css: { modules: { classNameStrategy: 'non-scoped' } },
    },
  }),
);
