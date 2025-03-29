import assert from 'assert'
import { streamObject } from 'ai'
import { z } from 'zod'

import { getLanguageModelFromContext } from '@ownxai/tools'
import { createArtifactHandler } from '@ownxai/tools/artifact'

export const codeArtifactHandler = createArtifactHandler<'code'>({
  kind: 'code',
  onCreateArtifact: async ({ title, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getLanguageModelFromContext(ctx)
    assert(model, 'Language model not found in context')

    let draftContent = ''

    const { fullStream } = streamObject({
      model,
      system: codePrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'object') {
        const { object } = delta
        const { code } = object

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code,
          })

          draftContent = code
        }
      }
    }

    return draftContent
  },
  onUpdateArtifact: async ({ artifact, description, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getLanguageModelFromContext(ctx)
    assert(model, 'Language model not found in context')

    let draftContent = ''

    const { fullStream } = streamObject({
      model,
      system: updateArtifactPrompt(artifact.content as string),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'object') {
        const { object } = delta
        const { code } = object

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code,
          })

          draftContent = code
        }
      }
    }

    return draftContent
  },
})

const codePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

\`\`\`python
# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
\`\`\`
`

const updateArtifactPrompt = (currentContent: string | null) =>
  `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
