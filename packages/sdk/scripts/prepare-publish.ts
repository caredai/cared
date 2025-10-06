import { copyFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const packagePath = resolve(__dirname, '../package.json')
const packageJson = require(packagePath)

const internalDevDependencies = [
  '@cared/api',
  '@cared/auth',
  '@cared/db',
  '@cared/providers',
  '@cared/shared',
]

copyFileSync(packagePath, packagePath + '.bak')

if (packageJson.devDependencies) {
  internalDevDependencies.forEach((dep) => {
    delete packageJson.devDependencies[dep]
  })
}

writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

console.log('package.json modified for publish: internal devDependencies removed.')
