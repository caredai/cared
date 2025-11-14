import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  noExternal: [
    '@cared/shared',
    '@cared/api',
    '@cared/db',
    '@cared/providers',
    '@cared/tools',
    '@cared/auth',
  ],
  format: ['esm', 'cjs'],
  experimentalDts: true,
})
