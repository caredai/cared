// eslint-disable-next-line import/no-anonymous-default-export
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  bracketSameLine: true,
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-multiline-arrays',
    'prettier-plugin-tailwindcss',
  ],
  importOrder: ['^@/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  overrides: [
    {
      files: '**/*.json',
      options: {
        plugins: ['prettier-plugin-sort-json'],
      },
    },
  ],
}
