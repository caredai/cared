import assert from 'assert'
import { smoothStream, streamText } from 'ai'

import { getLanguageModelFromContext } from '@mindworld/tools'
import { createArtifactHandler } from '@mindworld/tools/artifact'

export const textArtifactHandler = createArtifactHandler<'text'>({
  kind: 'text',
  onCreateArtifact: async ({ title, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getLanguageModelFromContext(ctx)
    assert(model, 'Language model not found in context')

    let draftContent = ''

    const { fullStream } = streamText({
      model,
      system:
        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title,
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'text-delta') {
        const { textDelta } = delta

        draftContent += textDelta

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        })
      }
    }

    return draftContent
  },
  onUpdateArtifact: async ({ artifact, description, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getLanguageModelFromContext(ctx)
    assert(model, 'Language model not found in context')

    let draftContent = ''

    const { fullStream } = streamText({
      model,
      system: updateArtifactPrompt(artifact.content as string),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: artifact.content as string,
          },
        },
      },
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'text-delta') {
        const { textDelta } = delta

        draftContent += textDelta
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        })
      }
    }

    return draftContent
  },
})

const updateArtifactPrompt = (currentContent: string | null) =>
  `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
