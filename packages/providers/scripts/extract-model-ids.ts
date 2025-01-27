import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function extractModelIds(providerPath: string): {
  languageModels?: string[]
  embeddingModels?: string[]
  imageModels?: string[]
} {
  const result = {
    languageModels: [] as string[],
    embeddingModels: [] as string[],
    imageModels: [] as string[],
  }

  const dtsPath = path.join(providerPath, 'dist', 'index.d.ts')
  if (!fs.existsSync(dtsPath)) {
    console.warn(`No index.d.ts found in ${providerPath}`)
    return result
  }

  const sourceFile = ts.createSourceFile(
    dtsPath,
    fs.readFileSync(dtsPath, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
  )

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.getText()
      if (name.match(/ModelId$/)) {
        const types = extractUnionTypeStrings(node.type)

        if (
          name.match(
            /Language|Chat|Completion|Messages|GoogleGenerativeAIModelId|GoogleVertexModelId/i,
          )
        ) {
          result.languageModels.push(...types)
        } else if (name.match(/Embedding/i)) {
          result.embeddingModels.push(...types)
        } else if (name.match(/Image/i)) {
          result.imageModels.push(...types)
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

function extractUnionTypeStrings(node: ts.TypeNode): string[] {
  if (ts.isUnionTypeNode(node)) {
    return node.types
      .map((type) => {
        if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) {
          return type.literal.text
        }
        return null
      })
      .filter((x): x is string => x !== null)
  }
  return []
}

async function main() {
  const providersDir = path.join(__dirname, '../../../node_modules/@ai-sdk')
  const providers = [
    'openai',
    'anthropic',
    'deepseek',
    'azure',
    'amazon-bedrock',
    'google',
    'google-vertex',
    'mistral',
    'xai',
    'togetherai',
    'cohere',
    'fireworks',
    'deepinfra',
    'cerebras',
    'groq',
    'replicate',
    'perplexity',
    'luma',
  ]

  const results: Record<string, ReturnType<typeof extractModelIds>> = {}

  for (const provider of providers) {
    if (['openai-compatible', 'provider'].indexOf(provider) >= 0) {
      continue
    }
    const providerPath = path.join(providersDir, provider)
    if (fs.statSync(providerPath).isDirectory()) {
      results[provider] = extractModelIds(providerPath)
    }
  }

  fs.writeFileSync(path.join(__dirname, '../src/model-ids.json'), JSON.stringify(results, null, 2))
}

main().catch(console.error)
