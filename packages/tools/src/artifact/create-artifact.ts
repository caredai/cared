import { tool } from 'ai'
import { z } from 'zod/v4'

import { generateArtifactId } from '@cared/db/schema'

import type { Context } from '../context'
import { artifactKinds, getArtifactHandler } from './server'

export const createArtifact = (ctx: Context) =>
  tool({
    description:
      'Create a artifact for a writing or content creation activities. This tool will call other functions that will generate the contents of the artifact based on the title and kind.',
    inputSchema: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateArtifactId()

      const dataStream = ctx.dataStream!

      dataStream.write({
        type: 'data-kind',
        data: kind,
        transient: true,
      })

      dataStream.write({
        type: 'data-id',
        data: id,
        transient: true,
      })

      dataStream.write({
        type: 'data-title',
        data: title,
        transient: true,
      })

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
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

      dataStream.write({ type: 'data-finish', data: null, transient: true })

      return {
        id,
        title,
        kind,
        content: 'A artifact was created and is now visible to the user.',
      }
    },
  })
