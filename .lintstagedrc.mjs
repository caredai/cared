import { dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log(__dirname)
const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => relative(__dirname, f)).join(' --file ')}`

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, 'prettier --write'],
  '!(*.{js,jsx,ts,tsx})': ['prettier --write'],
}
