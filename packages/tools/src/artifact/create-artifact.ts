import { tool } from 'ai'
import { z } from 'zod'

import { generateArtifactId } from '@ownxai/db/schema'

import type { Context } from '../context'
import { artifactKinds, getArtifactHandler } from './server'

export const createArtifact = (ctx: Context) =>
  tool({
    description:
      'Create a artifact for a writing or content creation activities. This tool will call other functions that will generate the contents of the artifact based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateArtifactId()

      const dataStream = ctx.dataStream!

      dataStream.writeData({
        type: 'kind',
        content: kind,
      })

      dataStream.writeData({
        type: 'id',
        content: id,
      })

      dataStream.writeData({
        type: 'title',
        content: title,
      })

      dataStream.writeData({
        type: 'clear',
        content: '',
      })

      const artifactHandler = getArtifactHandler(kind)

      if (!artifactHandler) {
        throw new Error(`No artifact handler found for kind: ${kind}`)
      }

      await artifactHandler.onCreateArtifact({
        id,
        title,
        ctx,
      })

      dataStream.writeData({ type: 'finish', content: '' })

      return {
        id,
        title,
        kind,
        content: 'A artifact was created and is now visible to the user.',
      }
    },
  })
