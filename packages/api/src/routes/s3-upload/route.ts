import type { NextRequest } from 'next/server'
import { TRPCError } from '@trpc/server'
import mime from 'mime'
import { sanitizeKey } from 'next-s3-upload'
import { POST as APIRoute } from 'next-s3-upload/route'
import { v7 as uuid } from 'uuid'

import { and, eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { App, Chat, Dataset, Membership } from '@mindworld/db/schema'
import { log } from '@mindworld/log'

import { auth } from '../../auth'
import { env } from '../../env'

const allowedExtensions = [
  'jpg',
  'jpeg',
  'webp',
  'avif',
  'png',
  'gif',
  'svg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
]

export type StorageLocation =
  // {workspaceId}/{datasetId}/{uuid}/{filename}
  | {
      type: 'dataset'
      datasetId: string
    }
  // {workspaceId}/{appId}/{uuid}/{filename}
  | {
      type: 'app'
      appId: string
    }
  // {workspaceId}/{appId}/{chatId}/{uuid}/{filename}
  | {
      type: 'chat'
      chatId: string
    }
  // temp/{uuid}/{filename}
  | {
      type: 'temp'
    }

const _APIRoute = APIRoute.configure({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  async key(req, filename) {
    const { userId } = await auth()
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const url = req.url.split('?')[1]
    const params = new URLSearchParams(url)
    const mimeType = params.get('mimeType')
    const location = Object.fromEntries(params.entries()) as StorageLocation
    console.debug('location', location, 'mimeType', mimeType)

    const fileType = mimeType ? mime.getExtension(mimeType) : filename.split('.').pop()
    if (!fileType || !allowedExtensions.includes(fileType)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid file type',
      })
    }

    const name = `${uuid()}/${sanitizeKey(filename)}`

    // Determine storage path based on location type
    switch (location.type) {
      case 'temp':
        // Temporary file storage path
        return `temp/${name}`

      case 'dataset': {
        // Retrieve dataset to get workspaceId
        const dataset = await db.query.Dataset.findFirst({
          where: eq(Dataset.id, location.datasetId),
        })
        if (!dataset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Dataset not found',
          })
        }

        // Verify user is a workspace member
        const membership = await db.query.Membership.findFirst({
          where: and(
            eq(Membership.workspaceId, dataset.workspaceId),
            eq(Membership.userId, userId),
          ),
        })
        if (!membership) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a member of this workspace',
          })
        }

        return `${dataset.workspaceId}/${location.datasetId}/${name}`
      }

      case 'app': {
        // Retrieve app to get workspaceId
        const app = await db.query.App.findFirst({
          where: eq(App.id, location.appId),
        })
        if (!app) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'App not found',
          })
        }

        // Verify user is a workspace member
        const membership = await db.query.Membership.findFirst({
          where: and(eq(Membership.workspaceId, app.workspaceId), eq(Membership.userId, userId)),
        })
        if (!membership) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a member of this workspace',
          })
        }

        return `${app.workspaceId}/${location.appId}/${name}`
      }

      case 'chat': {
        // Retrieve chat to get appId
        const chat = await db.query.Chat.findFirst({
          where: eq(Chat.id, location.chatId),
        })
        if (!chat) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Chat not found',
          })
        }

        // Get app to retrieve workspaceId
        const app = await db.query.App.findFirst({
          where: eq(App.id, chat.appId),
        })
        if (!app) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'App not found for this chat',
          })
        }

        // Verify user is a workspace member
        const membership = await db.query.Membership.findFirst({
          where: and(eq(Membership.workspaceId, app.workspaceId), eq(Membership.userId, userId)),
        })
        if (!membership) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not a member of this workspace',
          })
        }

        const key = `${app.workspaceId}/${chat.appId}/${location.chatId}/${name}`

        log.debug('S3 upload file', {
          location,
          key,
        })

        return key
      }

      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid location type',
        })
    }
  },
})

export const POST = async (request: NextRequest): Promise<Response> => {
  return await _APIRoute(request)
}

export type ParsedStorageLocation =
  // {workspaceId}/{datasetId}/{uuid}/{filename}
  | {
      type: 'dataset'
      workspaceId: string
      datasetId: string
    }
  // {workspaceId}/{appId}/{uuid}/{filename}
  | {
      type: 'app'
      workspaceId: string
      appId: string
    }
  // {workspaceId}/{appId}/{chatId}/{uuid}/{filename}
  | {
      type: 'chat'
      workspaceId: string
      appId: string
      chatId: string
    }
  // temp/{uuid}/{filename}
  | {
      type: 'temp'
    }

/**
 * Parse S3 URL to extract StorageLocation, UUID and filename
 *
 * @param url The S3 URL to parse
 * @returns An object containing parsed storage location, UUID and filename
 */
export function parseS3Url(url: string):
  | {
      location: ParsedStorageLocation
      uuid: string
      filename: string
    }
  | undefined {
  if (!url.startsWith(env.NEXT_PUBLIC_MIND_URL)) {
    return
  }

  // Extract path from URL
  const path = new URL(url).pathname.slice(1) // Remove leading slash

  const pathParts = path.split('/')

  // Get filename and UUID (last two parts)
  const filename = pathParts.pop()
  const uuid = pathParts.pop()
  if (!filename || !uuid) {
    return
  }

  const firstId = pathParts[0]
  if (!firstId) {
    return
  }

  // Check for temp storage
  if (firstId === 'temp') {
    return {
      location: { type: 'temp' },
      uuid,
      filename,
    }
  }

  // Check for workspace
  const workspaceId = firstId
  if (!workspaceId.startsWith('workspace_')) {
    return
  }

  const secondId = pathParts[1]
  if (!secondId) {
    return
  }

  // Check for dataset
  if (secondId.startsWith('dataset_')) {
    return {
      location: {
        type: 'dataset',
        workspaceId,
        datasetId: secondId,
      },
      uuid,
      filename,
    }
  }

  // Check for app
  if (!secondId.startsWith('app_')) {
    return
  }

  const appId = secondId

  const chatId = pathParts[2]

  if (!chatId) {
    return {
      location: {
        type: 'app',
        workspaceId,
        appId,
      },
      uuid,
      filename,
    }
  }

  // Check for chat
  if (!chatId.startsWith('chat_')) {
    return
  }

  return {
    location: {
      type: 'chat',
      workspaceId,
      appId,
      chatId,
    },
    uuid,
    filename,
  }
}
