import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { TRPCError } from '@trpc/server'
import sanitize from 'sanitize-filename'
import { v7 as uuid } from 'uuid'

import { env } from '../env'
import { s3Client } from '../s3'
import { measure } from '../utils'

export function imageUrl() {
  if (!env.NEXT_PUBLIC_IMAGE_URL) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Environment variable NEXT_PUBLIC_IMAGE_URL is not set',
    })
  }

  return env.NEXT_PUBLIC_IMAGE_URL
}

export async function uploadImage(dataUrl: string, name: string, prefix: string) {
  // Convert data URL to buffer
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const key = `${prefix}/${uuid()}/${sanitize(name)}.png`
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
