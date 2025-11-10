import { ORPCError } from '@orpc/server'
import mime from 'mime'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'
import { z } from 'zod/v4'

import { eq } from '@cared/db'
import { db } from '@cared/db/client'
import { App, Chat, Dataset } from '@cared/db/schema'

import type { Auth } from '../auth'
import { env } from '../env'

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

export const s3LocationSchema = z.discriminatedUnion('type', [
  // {accountId}/{uuid}/{filename}
  z.object({
    type: z.literal('account'),
    accountId: z.string(),
  }),
  // {accountId}/{datasetId}/{uuid}/{filename}
  z.object({
    type: z.literal('dataset'),
    datasetId: z.string(),
  }),
  // {accountId}/{appId}/{uuid}/{filename}
  z.object({
    type: z.literal('app'),
    appId: z.string(),
  }),
  // {accountId}/{appId}/{chatId}/{uuid}/{filename}
  z.object({
    type: z.literal('chat'),
    chatId: z.string(),
  }),
  // temp/{uuid}/{filename}
  z.object({
    type: z.literal('temp'),
  }),
])

export type S3Location = z.infer<typeof s3LocationSchema>

export const s3KeyRequestSchema = z
  .object({
    filename: z.string(),
    filetype: z.string().optional(),
    mimeType: z.string().optional(),
  })
  .and(s3LocationSchema)

export async function getS3Key({
  auth,
  location,
}: {
  auth: Auth
  location: z.infer<typeof s3KeyRequestSchema>
}) {
  const filename = location.filename
  const mimeType = location.mimeType ?? location.filetype
  const fileType = mimeType ? mime.getExtension(mimeType) : filename.split('.').pop()
  if (!fileType || !allowedExtensions.includes(fileType)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Invalid file type',
    })
  }

  const name = `${uuid()}/${sanitize(filename)}`

  async function getKey() {
    // Determine storage path based on location type
    switch (location.type) {
      case 'temp':
        // Temporary file storage path
        return `temp/${name}` // TODO: permission check

      case 'account': {
        await auth.requirePermissions({ account: ['write'] }, { accountId: location.accountId })

        return `${location.accountId}/${name}`
      }

      case 'dataset': {
        // Retrieve dataset to get accountId
        const dataset = await db.query.Dataset.findFirst({
          where: eq(Dataset.id, location.datasetId),
        })
        if (!dataset) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Dataset not found',
          })
        }

        await auth.requirePermissions({ dataset: ['write'] }, { accountId: dataset.accountId })

        return `${dataset.accountId}/${location.datasetId}/${name}`
      }

      case 'app': {
        // Retrieve app to get accountId
        const app = await db.query.App.findFirst({
          where: eq(App.id, location.appId),
        })
        if (!app) {
          throw new ORPCError('NOT_FOUND', {
            message: 'App not found',
          })
        }

        await auth.requirePermissions({ app: ['write'] }, { accountId: app.accountId })

        return `${app.accountId}/${location.appId}/${name}`
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

        // Get app to retrieve accountId
        const app = await db.query.App.findFirst({
          where: eq(App.id, chat.appId),
        })
        if (!app) {
          throw new ORPCError('NOT_FOUND', {
            message: 'App not found for this chat',
          })
        }

        if (!auth.isUser) {
          throw new ORPCError('FORBIDDEN')
        }

        return `${app.accountId}/${chat.appId}/${location.chatId}/${name}`
      }

      default:
        throw new ORPCError('BAD_REQUEST', {
          message: 'Invalid location type',
        })
    }
  }

  const key = await getKey()

  return {
    key,
    mimeType,
    fileType,
  }
}

export type ParsedS3Url = {
  uuid: string
  filename: string
} & ( // {accountId}/{uuid}/{filename}
  | {
      type: 'account'
      accountId: string
    }
  // {accountId}/{datasetId}/{uuid}/{filename}
  | {
      type: 'dataset'
      accountId: string
      datasetId: string
    }
  // {accountId}/{appId}/{uuid}/{filename}
  | {
      type: 'app'
      accountId: string
      appId: string
    }
  // {accountId}/{appId}/{chatId}/{uuid}/{filename}
  | {
      type: 'chat'
      accountId: string
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
  if (!env.VITE_IMAGE_URL || !url.startsWith(env.VITE_IMAGE_URL)) {
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

  // Check for account
  const accountId = firstId
  if (!accountId.startsWith('acc_')) {
    return false
  }

  const secondId = pathParts[1]
  if (!secondId) {
    return {
      type: 'account',
      accountId,
      uuid,
      filename,
    }
  }

  // Check for dataset
  if (secondId.startsWith('dataset_')) {
    return {
      type: 'dataset',
      accountId,
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
      accountId,
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
    accountId,
    appId,
    chatId,
    uuid,
    filename,
  }
}
