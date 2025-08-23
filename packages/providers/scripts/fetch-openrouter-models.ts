import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'

import { getOpenRouterModels } from '../src/openrouter'

// @ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  try {
    // Fetch OpenRouter models
    const models = await getOpenRouterModels()
    console.log(`Fetched ${models.length} models from OpenRouter`)

    // Path to the openrouter.json file
    const openrouterJsonFilePath = path.join(__dirname, '../data/openrouter.json')
    // Path to the openrouter.ts file
    const openrouterTsFilePath = path.join(__dirname, '../src/provider-info/openrouter.ts')

    // Write models to the openrouter.json file
    fs.writeFileSync(openrouterJsonFilePath, JSON.stringify(models, null, 2), 'utf-8')

    // Read the file content
    const sourceCode = fs.readFileSync(openrouterTsFilePath, 'utf-8')

    // Parse the source code
    const sourceFile = ts.createSourceFile(
      openrouterTsFilePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
    )

    // Create a printer for output
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })

    // Transform the AST to add models to languageModels array
    const transformedSourceFile = ts.transform(sourceFile, [
      (context) => {
        return (rootNode) => {
          function visit(node: ts.Node): ts.Node {
            if (ts.isObjectLiteralExpression(node)) {
              // Find the languageModels property
              const languageModelsProperty = node.properties.find(
                (prop) =>
                  ts.isPropertyAssignment(prop) &&
                  ts.isIdentifier(prop.name) &&
                  prop.name.text === 'languageModels',
              )

              if (languageModelsProperty && ts.isPropertyAssignment(languageModelsProperty)) {
                // Create the new languageModels array with the fetched models
                const newLanguageModelsArray = ts.factory.createArrayLiteralExpression(
                  models.map((model) => {
                    // Create object literal for each model
                    const properties = [
                      ts.factory.createPropertyAssignment(
                        'id',
                        ts.factory.createStringLiteral(model.id),
                      ),
                      ts.factory.createPropertyAssignment(
                        'name',
                        ts.factory.createStringLiteral(model.name),
                      ),
                      ts.factory.createPropertyAssignment(
                        'description',
                        ts.factory.createStringLiteral(model.description || ''),
                      ),
                    ]

                    // Add optional properties if they exist
                    if (model.contextWindow !== undefined) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'contextWindow',
                          ts.factory.createNumericLiteral(model.contextWindow.toString()),
                        ),
                      )
                    }
                    if (model.maxOutputTokens !== undefined) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'maxOutputTokens',
                          ts.factory.createNumericLiteral(model.maxOutputTokens.toString()),
                        ),
                      )
                    }
                    if (model.inputTokenPrice) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'inputTokenPrice',
                          ts.factory.createStringLiteral(model.inputTokenPrice),
                        ),
                      )
                    }
                    if (model.cachedInputTokenPrice) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'cachedInputTokenPrice',
                          ts.factory.createStringLiteral(model.cachedInputTokenPrice),
                        ),
                      )
                    }
                    if (model.cacheInputTokenPrice) {
                      // Handle the union type for cacheInputTokenPrice
                      const cachePriceValue =
                        typeof model.cacheInputTokenPrice === 'string'
                          ? model.cacheInputTokenPrice
                          : JSON.stringify(model.cacheInputTokenPrice)
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'cacheInputTokenPrice',
                          ts.factory.createStringLiteral(cachePriceValue),
                        ),
                      )
                    }
                    if (model.outputTokenPrice) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'outputTokenPrice',
                          ts.factory.createStringLiteral(model.outputTokenPrice),
                        ),
                      )
                    }
                    if (
                      model.deprecated !== undefined ||
                      model.description.includes('deprecated')
                    ) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'deprecated',
                          model.deprecated || model.description.includes('deprecated')
                            ? ts.factory.createTrue()
                            : ts.factory.createFalse(),
                        ),
                      )
                    }
                    if (model.retired !== undefined) {
                      properties.push(
                        ts.factory.createPropertyAssignment(
                          'retired',
                          model.retired ? ts.factory.createTrue() : ts.factory.createFalse(),
                        ),
                      )
                    }
                    // Set chargeable to true for all OpenRouter models
                    properties.push(
                      ts.factory.createPropertyAssignment('chargeable', ts.factory.createTrue()),
                    )

                    return ts.factory.createObjectLiteralExpression(properties, true)
                  }),
                  true,
                )

                // Replace the existing languageModels property
                const newProperties = node.properties.map((prop) => {
                  if (
                    ts.isPropertyAssignment(prop) &&
                    ts.isIdentifier(prop.name) &&
                    prop.name.text === 'languageModels'
                  ) {
                    return ts.factory.createPropertyAssignment(prop.name, newLanguageModelsArray)
                  }
                  return prop
                })

                return ts.factory.createObjectLiteralExpression(newProperties, true)
              }
            }

            return ts.visitEachChild(node, visit, context)
          }

          return visit(rootNode) as ts.SourceFile
        }
      },
    ]).transformed[0]

    // Generate the new source code
    const newSourceCode = printer.printNode(
      ts.EmitHint.SourceFile,
      transformedSourceFile,
      sourceFile,
    )

    // Write the updated content back to the file
    fs.writeFileSync(openrouterTsFilePath, newSourceCode, 'utf-8')

    console.log(`Successfully updated ${openrouterTsFilePath} with ${models.length} models`)
  } catch (error) {
    console.error('Error updating openrouter.ts file:', error)
    process.exit(1)
  }
}

main()
