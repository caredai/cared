import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/react/client.tsx',
    'src/react/server.tsx',
  ],
  format: ['cjs', 'esm'],
  dts: true,
})
