import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globalSetup: ['src/tests/global-setup.ts'],
    setupFiles: ['src/tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/stores/**', 'src/lib/hub-nav.ts', 'src/lib/utils.ts'],
    },
  },
})
