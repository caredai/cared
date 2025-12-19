import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import { env } from './env.js'

let s3: S3Client | undefined

export function getS3() {
  s3 ??= new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
  })
  return s3
}

/**
 * Uploads data to S3
 * @param key The S3 object key (path)
 * @param body The data to upload as Buffer
 * @returns The S3 location URL
 */
export async function uploadToS3(key: string, body: Buffer): Promise<string> {
  const client = getS3()
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: body,
  })

  await client.send(command)
  return `s3://${env.S3_BUCKET}/${key}`
}

/**
 * Downloads data from S3
 * @param key The S3 object key (path)
 * @returns The downloaded data as Buffer
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const client = getS3()
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })

  const response = await client.send(command)
  if (!response.Body) {
    throw new Error(`No body returned from S3 for key: ${key}`)
  }

  return Buffer.from(await response.Body.transformToByteArray())
}

/**
 * Deletes an object from S3
 * @param key The S3 object key (path)
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3()
  const command = new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  })

  await client.send(command)
}
