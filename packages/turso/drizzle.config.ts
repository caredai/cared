import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'turso',
  casing: 'camelCase',
  verbose: true,
})
