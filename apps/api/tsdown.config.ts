import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  dts: {
    resolver: 'tsc',
    sourcemap: true,
  },
  noExternal: [/^@cared\//],
  inlineOnly: false,
  shims: true,
  unbundle: true,
})
