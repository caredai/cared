/**
 * Script to generate api types from root.d.ts
 * This script extracts types from root.d.ts and creates a new api.d.ts file
 * with all internal types redefined for external use
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define paths
const ROOT_DTS_PATH = path.resolve(__dirname, '../dist/src/orpc/router.d.ts')
const OUTPUT_PATH = path.resolve(__dirname, '../../sdk/src/api.d.ts')
const PACKAGES_ROOT = path.resolve(__dirname, '../../')

// Define special type definitions for external dependencies
const EXTERNAL_TYPE_DEFINITIONS = `export * from '@cared/shared'
`

/**
 * Maps a @cared import path to actual file path in monorepo
 * Example: @cared/db/schema/app -> packages/db/src/schema/app.ts
 *          @cared/db/schema -> packages/db/src/schema/index.ts
 */
function resolveMonorepoPath(importPath: string): string {
  const cleanPath = importPath
    .replace(/["']/g, '') // Remove quotes
    .replace('@cared/', '') // Remove @cared prefix

  // Split into package name and subpath
  const [pkgName, ...subPaths] = cleanPath.split('/')

  // Construct base path
  const basePath = path.join(PACKAGES_ROOT, pkgName, 'src', ...subPaths)

  // Try direct .ts file first
  const tsPath = basePath + '.ts'
  if (fs.existsSync(tsPath)) {
    return tsPath
  }

  // Try index.ts in directory
  const indexPath = path.join(basePath, 'index.ts')
  if (fs.existsSync(indexPath)) {
    return indexPath
  }

  // Return the .ts path as fallback (will fail fs.existsSync check later)
  return tsPath
}

// Helper function to extract type definitions from source files
async function extractTypeDefinition(
  importPath: string,
  processedFiles: Set<string> = new Set(),
  resolvedPath?: string,
): Promise<string | null> {
  // Resolve the actual file path in monorepo
  const filePath = !resolvedPath ? resolveMonorepoPath(importPath) : resolvedPath

  if (!fs.existsSync(filePath)) {
    console.warn(`Source file not found: ${filePath}`)
    return null
  }

  // Prevent infinite recursion
  if (processedFiles.has(filePath)) {
    console.log(`Skipping already processed file: ${filePath}`)
    return null
  }

  processedFiles.add(filePath)

  console.log(`Absolute filepath: ${filePath}`)
  const sourceContent = fs.readFileSync(filePath, 'utf-8')
  const parsedSourceFile = ts.createSourceFile(
    filePath,
    sourceContent,
    ts.ScriptTarget.Latest,
    true,
  )

  let typeDefinition = ''

  // Visit each node to find type definitions
  async function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      // Get the type name
      const typeName = node.name.getText(parsedSourceFile)

      // Only extract the type if it matches one we're looking for
      if (caredImports.get(importPath)?.has(typeName)) {
        typeDefinition +=
          sourceContent.slice(node.getStart(parsedSourceFile), node.getEnd()) + '\n\n'
      }
    }

    // Handle export statements that re-export from other modules
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      const moduleSpecifier = node.moduleSpecifier.getText(parsedSourceFile)
      // Remove quotes from module specifier
      const cleanModuleSpecifier = moduleSpecifier.replace(/["']/g, '')

      // Handle relative imports (e.g., './auth', '../types')
      if (cleanModuleSpecifier.startsWith('.')) {
        const resolvedModulePath = path.resolve(path.dirname(filePath), cleanModuleSpecifier)

        // Try to resolve the actual file
        let actualModulePath = resolvedModulePath
        if (fs.existsSync(resolvedModulePath + '.ts')) {
          actualModulePath = resolvedModulePath + '.ts'
        } else if (fs.existsSync(path.join(resolvedModulePath, 'index.ts'))) {
          actualModulePath = path.join(resolvedModulePath, 'index.ts')
        }

        if (fs.existsSync(actualModulePath)) {
          console.log(`Found re-export from: ${actualModulePath}`)
          const reExportedTypes = await extractTypeDefinition(
            importPath,
            processedFiles,
            actualModulePath,
          )
          if (reExportedTypes) {
            typeDefinition += reExportedTypes
          }
        }
      }
    }

    // Recursively visit child nodes
    for (const child of node.getChildren(parsedSourceFile)) {
      await visit(child)
    }
  }

  await visit(parsedSourceFile)
  return typeDefinition
}

// Read and parse the root.d.ts file
const content = fs.readFileSync(ROOT_DTS_PATH, 'utf-8')
const rootSourceFile = ts.createSourceFile('root.d.ts', content, ts.ScriptTarget.Latest, true)

// Find all @cared imports and their type references
const caredImports = new Map<string, Set<string>>()
const typeReplacements = new Map<string, string>()

function visitNode(node: ts.Node) {
  if (ts.isImportTypeNode(node)) {
    const importPath = node.argument.getText(rootSourceFile)
    if (importPath.includes('@cared')) {
      // Skip DB client type
      if (importPath.includes('@cared/db/client') || importPath.includes('@cared/shared')) {
        return
      }

      const qualifier = node.qualifier?.getText(rootSourceFile)
      if (qualifier) {
        const importKey = importPath
        if (!caredImports.has(importKey)) {
          caredImports.set(importKey, new Set())
        }
        caredImports.get(importKey)!.add(qualifier)

        // Create replacement mapping
        const fullType = `import(${importPath}).${qualifier}`
        typeReplacements.set(fullType, qualifier)
      }
    }
  }
  ts.forEachChild(node, visitNode)
}

visitNode(rootSourceFile)

for (const type of ['ProviderId', 'ModelFullId', 'BaseModelInfo']) {
  caredImports.get('"@cared/providers"')?.add(type)
}

// Extract type definitions for all found imports
let typeDefinitions = EXTERNAL_TYPE_DEFINITIONS + '\n'
// @ts-ignore
for (const [importPath, types] of caredImports) {
  console.log(`Extract type definitions from ${importPath}`, Array.from(types))
  // @ts-ignore
  const typeDef = await extractTypeDefinition(importPath)
  if (typeDef) {
    typeDefinitions += typeDef
  }
}

// Replace all @cared imports with our local type definitions
let output = content
// @ts-ignore
for (const [fullType, replacement] of typeReplacements) {
  output = output.replace(
    new RegExp(fullType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    replacement,
  )
}

// Replace external imports with our predefined types
output = output
  .replace(
    /export declare const appRouter/g,
    '// eslint-disable-next-line @typescript-eslint/no-unused-vars\ndeclare const appRouter',
  )
  .replace(/ctx: \{[^}]+\}/g, 'ctx: any')
  .replace(/export type AppRouter/g, 'export type CaredOrpcRouter')
  // Remove sourceMappingURL
  .replace(/\/\/# sourceMappingURL=.*$/m, '')

// Add our type definitions at the top of the file
const finalOutput = typeDefinitions + output

// Write the output file
fs.writeFileSync(OUTPUT_PATH, finalOutput)

console.log('Successfully generated api types')
