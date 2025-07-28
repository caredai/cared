import { fileURLToPath } from 'url'

/** @typedef {import('prettier').Config} PrettierConfig */
/** @typedef {import('prettier-plugin-tailwindcss').PluginOptions} TailwindConfig */
/** @typedef {import('@ianvs/prettier-plugin-sort-imports').PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
  printWidth: 100,
  semi: false,
  singleQuote: true,
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
    'prettier-plugin-multiline-arrays',
  ],
  tailwindConfig: fileURLToPath(new URL('../../tooling/tailwind/web.ts', import.meta.url)),
  tailwindFunctions: ['cn', 'cva'],
  importOrder: [
    '<TYPES>',
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '^(next/(.*)$)|^(next$)',
    '^(expo(.*)$)|^(expo$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '<TYPES>^@cared',
    '^@cared/(.*)$',
    '',
    '<TYPES>^[.|..|~]',
    '^~/',
    '^@/',
    '^[../]',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '4.4.0',
  overrides: [
    {
      files: '*.json.hbs',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.js.hbs',
      options: {
        parser: 'babel',
      },
    },
    // {
    //   files: '**/*.json',
    //   options: {
    //     plugins: ['prettier-plugin-sort-json'],
    //   },
    // },
  ],
}

export default config
