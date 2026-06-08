import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/permission/test-setup.ts'],
    include: ['src/**/*.test.ts'],
  },
})
