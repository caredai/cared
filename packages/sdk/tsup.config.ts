import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react/index.tsx',
    'src/utils/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
})
