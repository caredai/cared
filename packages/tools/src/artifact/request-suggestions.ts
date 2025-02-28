import { streamObject, tool } from 'ai'
import { z } from 'zod'

import { eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Artifact, ArtifactSuggestion, generateArtifactSuggestionId } from '@mindworld/db/schema'

import type { Context } from '../context'
import { getLanguageModelFromContext } from '../context'

export const requestSuggestions = (ctx: Context) =>
  tool({
    description: 'Request suggestions for a artifact',
    parameters: z.object({
      artifactId: z.string().describe('The ID of the artifact to request edits'),
    }),
    execute: async ({ artifactId }) => {
      const dataStream = ctx.dataStream!

      const artifact = await db.query.Artifact.findFirst({
        where: eq(Artifact.id, artifactId),
      })
      if (!artifact?.content) {
        return {
          error: 'Artifact not found',
        }
      }

      const model = getLanguageModelFromContext(ctx)
      if (!model) {
        return {
          error: 'No language model found',
        }
      }

      const suggestions: Omit<ArtifactSuggestion, 'artifactVersion' | 'createdAt' | 'updatedAt'>[] =
        []

      const { elementStream } = streamObject({
        model,
        system:
          'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: artifact.content as string,
        output: 'array',
        schema: z.object({
          originalSentence: z.string().describe('The original sentence'),
          suggestedSentence: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
        }),
      })

      for await (const element of elementStream) {
        const suggestion = {
          id: generateArtifactSuggestionId(),
          artifactId: artifactId,
          originalText: element.originalSentence,
          suggestedText: element.suggestedSentence,
          description: element.description,
          isResolved: false,
        }

        dataStream.writeData({
          type: 'suggestion',
          content: suggestion,
        })

        suggestions.push(suggestion)
      }

      await db.insert(ArtifactSuggestion).values(
        suggestions.map((suggestion) => ({
          ...suggestion,
          artifactVersion: artifact.version,
        })),
      )

      return {
        id: artifactId,
        title: artifact.title,
        kind: artifact.kind,
        message: 'Suggestions have been added to the artifact',
      }
    },
  })
