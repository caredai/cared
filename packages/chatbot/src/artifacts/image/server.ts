import assert from 'assert'
import { experimental_generateImage } from 'ai'

import { getImageModelFromContext } from '@mindworld/tools'
import { createArtifactHandler } from '@mindworld/tools/artifact'

export const imageArtifactHandler = createArtifactHandler<'image'>({
  kind: 'image',
  onCreateArtifact: async ({ title, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getImageModelFromContext(ctx)
    assert(model, 'Image model not found in context')

    let draftContent = ''

    const { image } = await experimental_generateImage({
      model,
      prompt: title,
      n: 1,
    })

    draftContent = image.base64

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    })

    return draftContent
  },
  onUpdateArtifact: async ({ description, ctx }) => {
    const dataStream = ctx.dataStream!

    const model = getImageModelFromContext(ctx)
    assert(model, 'Image model not found in context')

    let draftContent = ''

    const { image } = await experimental_generateImage({
      model,
      prompt: description,
      n: 1,
    })

    draftContent = image.base64

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    })

    return draftContent
  },
})
