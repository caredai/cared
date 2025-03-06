import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react/client.tsx',
    'src/react/server.tsx',
    'src/utils/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
})
