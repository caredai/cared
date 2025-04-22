import type { NextRequest } from 'next/server'
import { TRPCError } from '@trpc/server'
import mime from 'mime'
import { sanitizeKey } from 'next-s3-upload'
import { POST as APIRoute } from 'next-s3-upload/route'
import { v7 as uuid } from 'uuid'

import { auth } from '../auth'
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

export type StorageLocation =
  // characters/{uuid}/{filename}
  | {
      type: 'character'
    }
  // backgrounds/{uuid}/{filename}
  | {
      type: 'background'
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

    const params = new URL(req.url).searchParams
    const mimeType = params.get('mimeType')
    params.delete('mimeType')
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

      case 'character': {
        return `characters/${name}`
      }

      case 'background': {
        return `backgrounds/${name}`
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

/**
 * Parse S3 URL to extract StorageLocation, UUID and filename
 *
 * @param url The S3 URL to parse
 * @returns An object containing parsed storage location, UUID and filename
 */
export function parseS3Url(url: string):
  | {
      location: StorageLocation
      uuid: string
      filename: string
    }
  | undefined {
  if (!env.NEXT_PUBLIC_IMAGE_URL || !url.startsWith(env.NEXT_PUBLIC_IMAGE_URL)) {
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

  const type = pathParts[0] as StorageLocation['type'] | undefined
  if (!type || !['character', 'background', 'temp'].includes(type)) {
    return
  }

  return {
    location: { type },
    uuid,
    filename,
  }
}
