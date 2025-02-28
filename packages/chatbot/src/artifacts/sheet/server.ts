import assert from 'assert'
import { streamObject } from 'ai'
import { z } from 'zod'

import { getLanguageModelFromContext } from '@mindworld/tools'
import { createArtifactHandler } from '@mindworld/tools/artifact'

export const sheetArtifactHandler = createArtifactHandler<'sheet'>({
  kind: 'sheet',
  onCreateArtifact: async ({ title, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getLanguageModelFromContext(ctx)
    assert(model, 'Language model not found in context')

    let draftContent = ''

    const { fullStream } = streamObject({
      model,
      system: sheetPrompt,
      prompt: title,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'object') {
        const { object } = delta
        const { csv } = object

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          })

          draftContent = csv
        }
      }
    }

    dataStream.writeData({
      type: 'sheet-delta',
      content: draftContent,
    })

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
        csv: z.string(),
      }),
    })

    for await (const delta of fullStream) {
      const { type } = delta

      if (type === 'object') {
        const { object } = delta
        const { csv } = object

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          })

          draftContent = csv
        }
      }
    }

    return draftContent
  },
})

const sheetPrompt = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`

const updateArtifactPrompt = (currentContent: string | null) =>
  `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
