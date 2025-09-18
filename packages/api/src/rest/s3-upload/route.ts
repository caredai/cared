import type { NextRequest } from 'next/server'
import { ORPCError } from '@orpc/server'
import mime from 'mime'
import { sanitizeKey } from 'next-s3-upload'
import { POST as APIRoute } from 'next-s3-upload/route'
import { v7 as uuid } from 'uuid'
import { z } from 'zod/v4'

import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { App, Chat, Dataset, Workspace } from '@cared/db/schema'

import { authenticate, OrganizationScope } from '../../auth'
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

export type S3LocationRequest = { mimeType?: string } & ( // {workspaceId}/{uuid}/{filename}
  | {
      type: 'workspace'
      workspaceId: string
    }
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
)

export const s3LocationRequestSchema = z
  .object({
    mimeType: z.string().optional(),
  })
  .and(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('workspace'),
        workspaceId: z.string(),
      }),
      z.object({
        type: z.literal('dataset'),
        datasetId: z.string(),
      }),
      z.object({
        type: z.literal('app'),
        appId: z.string(),
      }),
      z.object({
        type: z.literal('chat'),
        chatId: z.string(),
      }),
      z.object({
        type: z.literal('temp'),
      }),
    ]),
  )

const _: z.infer<typeof s3LocationRequestSchema> = {} as S3LocationRequest

const _APIRoute = APIRoute.configure({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  async key(req, filename) {
    const auth = await authenticate()
    if (!auth.isAuthenticated()) {
      throw new ORPCError('UNAUTHORIZED')
    }

    const params = new URL(req.url).searchParams
    const location = s3LocationRequestSchema.parse(Object.fromEntries(params.entries()))
    console.debug('S3 location request:', location)

    const mimeType = location.mimeType
    const fileType = mimeType ? mime.getExtension(mimeType) : filename.split('.').pop()
    if (!fileType || !allowedExtensions.includes(fileType)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Invalid file type',
      })
    }

    const name = `${uuid()}/${sanitizeKey(filename)}`

    // Determine storage path based on location type
    switch (location.type) {
      case 'temp':
        // Temporary file storage path
        return `temp/${name}` // TODO: permission check

      case 'workspace': {
        const workspace = await db.query.Workspace.findFirst({
          where: eq(Workspace.id, location.workspaceId),
        })
        if (!workspace) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Workspace not found',
          })
        }

        const scope = await OrganizationScope.fromWorkspace({ auth, db }, workspace.id)
        await scope.checkPermissions({
          workspace: ['update'],
        })

        return `${workspace.id}/${name}`
      }

      case 'dataset': {
        // Retrieve dataset to get workspaceId
        const dataset = await db.query.Dataset.findFirst({
          where: eq(Dataset.id, location.datasetId),
        })
        if (!dataset) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Dataset not found',
          })
        }

        const scope = await OrganizationScope.fromWorkspace({ auth, db }, dataset.workspaceId)
        await scope.checkPermissions({
          dataset: ['update'],
        })

        return `${dataset.workspaceId}/${location.datasetId}/${name}`
      }

      case 'app': {
        // Retrieve app to get workspaceId
        const app = await db.query.App.findFirst({
          where: eq(App.id, location.appId),
        })
        if (!app) {
          throw new ORPCError('NOT_FOUND', {
            message: 'App not found',
          })
        }

        const scope = await OrganizationScope.fromApp({ auth, db }, app)
        await scope.checkPermissions({
          app: ['update'],
        })

        return `${app.workspaceId}/${location.appId}/${name}`
      }

      case 'chat': {
        // Retrieve chat to get appId
        const chat = await db.query.Chat.findFirst({
          where: eq(Chat.id, location.chatId),
        })
        if (!chat) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Chat not found',
          })
        }

        // Get app to retrieve workspaceId
        const app = await db.query.App.findFirst({
          where: eq(App.id, chat.appId),
        })
        if (!app) {
          throw new ORPCError('NOT_FOUND', {
            message: 'App not found for this chat',
          })
        }

        if (!auth.isUser()) {
          throw new ORPCError('FORBIDDEN')
        }

        return `${app.workspaceId}/${chat.appId}/${location.chatId}/${name}`
      }

      default:
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid location type',
        })
    }
  },
})

export const POST = async (request: NextRequest): Promise<Response> => {
  return await _APIRoute(request)
}

export type ParsedS3Url = {
  uuid: string
  filename: string
} & ( // {workspaceId}/{uuid}/{filename}
  | {
      type: 'workspace'
      workspaceId: string
    }
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
)

/**
 * Parse S3 URL to extract StorageLocation, UUID and filename
 *
 * @param url The S3 URL to parse
 * @returns An object containing parsed storage location, UUID and filename
 */
export function parseS3Url(url: string): ParsedS3Url | false | undefined {
  if (!env.NEXT_PUBLIC_IMAGE_URL || !url.startsWith(env.NEXT_PUBLIC_IMAGE_URL)) {
    return undefined
  }

  // Extract path from URL
  const path = new URL(url).pathname.slice(1) // Remove leading slash

  const pathParts = path.split('/')

  // Get filename and UUID (last two parts)
  const filename = pathParts.pop()
  const uuid = pathParts.pop()
  if (!filename || !uuid) {
    return false
  }

  const firstId = pathParts[0]
  if (!firstId) {
    return false
  }

  // Check for temp storage
  if (firstId === 'temp') {
    return {
      type: 'temp',
      uuid,
      filename,
    }
  }

  // Check for workspace
  const workspaceId = firstId
  if (!workspaceId.startsWith('workspace_')) {
    return false
  }

  const secondId = pathParts[1]
  if (!secondId) {
    return {
      type: 'workspace',
      workspaceId,
      uuid,
      filename,
    }
  }

  // Check for dataset
  if (secondId.startsWith('dataset_')) {
    return {
      type: 'dataset',
      workspaceId,
      datasetId: secondId,
      uuid,
      filename,
    }
  }

  // Check for app
  if (!secondId.startsWith('app_')) {
    return false
  }

  const appId = secondId

  const chatId = pathParts[2]

  if (!chatId) {
    return {
      type: 'app',
      workspaceId,
      appId,
      uuid,
      filename,
    }
  }

  // Check for chat
  if (!chatId.startsWith('chat_')) {
    return false
  }

  return {
    type: 'chat',
    workspaceId,
    appId,
    chatId,
    uuid,
    filename,
  }
}
