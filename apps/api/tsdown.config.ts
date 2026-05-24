import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: {
    resolver: 'tsc',
    sourcemap: true,
  },
  shims: true,
  // unbundle: true,
  deps: {
    alwaysBundle: [/^@cared\//],
    neverBundle: [
      '#tanstack-router-entry',
      '#tanstack-start-entry',
      '#tanstack-start-plugin-adapters',
    ],
  },
})
