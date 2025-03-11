import { S3Client } from '@aws-sdk/client-s3'

import { env } from '../../env'

let s3Client: S3Client | undefined

export function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
    })
  }
  return s3Client
}
