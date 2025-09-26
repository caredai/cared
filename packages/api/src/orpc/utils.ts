import { Buffer } from 'buffer'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { ORPCError } from '@orpc/server'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'

import { s3Client } from '../client/s3'
import { env } from '../env'
import { measure } from '../utils'

export function imageUrl() {
  if (!env.VITE_IMAGE_URL) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'Environment variable VITE_IMAGE_URL is not set',
    })
  }

  return env.VITE_IMAGE_URL
}

export async function uploadImage(
  dataUrlOrBytes: string | Uint8Array | Buffer,
  key:
    | string
    | {
        name: string
        prefix: string
      },
) {
  let buffer
  if (typeof dataUrlOrBytes === 'string') {
    // Convert data URL to buffer
    const base64Data = dataUrlOrBytes.replace(/^data:image\/\w+;base64,/, '')
    buffer = Buffer.from(base64Data, 'base64')
  } else {
    buffer = dataUrlOrBytes
  }

  key = typeof key === 'string' ? key : `${key.prefix}/${uuid()}/${sanitize(key.name)}.png`

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
  })

  const [execSeconds] = await measure(s3Client.send(command))
  console.log('Upload image to object storage', {
    key,
    size: buffer.length,
    execSeconds,
  })

  return new URL(key, imageUrl()).toString()
}

export async function deleteImage(url: string) {
  if (!url.startsWith(env.S3_ENDPOINT) && !url.startsWith(imageUrl())) {
    return
  }
  const key = decodeURIComponent(new URL(url).pathname.slice(1)) // Remove leading slash
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })
  await s3Client.send(command)
}

export async function deleteImages(urls: string[]) {
  // Filter out invalid URLs and extract keys
  const keys = urls
    .filter((url) => url.startsWith(env.S3_ENDPOINT) || url.startsWith(imageUrl()))
    .map((url) => ({
      Key: decodeURIComponent(new URL(url).pathname.slice(1)), // Remove leading slash
    }))

  if (keys.length === 0) {
    return
  }

  // AWS S3 DeleteObjects has a limit of 1000 objects per request
  const chunkSize = 1000
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize)
    const command = new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: {
        Objects: chunk,
        Quiet: true, // Don't return detailed errors for each object
      },
    })
    console.log(
      'Deleting images from object storage',
      chunk.map((key) => key.Key),
    )
    await s3Client.send(command)
  }
}

export async function retrieveImage(url: string): Promise<Uint8Array> {
  if (!url.startsWith(env.S3_ENDPOINT) && !url.startsWith(imageUrl())) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Invalid image url',
    })
  }

  const key = decodeURIComponent(new URL(url).pathname.slice(1)) // Remove leading slash
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })

  const [execSeconds, response] = await measure(s3Client.send(command))
  const { Body } = response

  if (!Body) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Image not found',
    })
  }

  const bytes = await Body.transformToByteArray()

  console.log('Retrieved image from object storage', {
    key,
    size: bytes.length,
    execSeconds,
  })

  return bytes
}
