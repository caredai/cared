import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { TRPCError } from '@trpc/server'
import { sanitizeKey } from 'next-s3-upload'
import { POST as APIRoute } from 'next-s3-upload/route'
import { v7 as uuid } from 'uuid'

import { and, eq } from '@mindworld/db'
import { db } from '@mindworld/db/client'
import { Dataset, Membership } from '@mindworld/db/schema'
import { log } from '@mindworld/utils'

import { env } from '../env'

export interface S3UploadParams {
  workspaceId: string
  datasetId: string

  [key: string]: unknown
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

    const { workspaceId, datasetId } = (await req.json()) as S3UploadParams

    const membership = await db.query.Membership.findFirst({
      where: and(eq(Membership.workspaceId, workspaceId), eq(Membership.userId, userId)),
    })
    if (!membership) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not a member of this workspace',
      })
    }

    const dataset = await db.query.Dataset.findFirst({
      where: and(eq(Dataset.workspaceId, workspaceId), eq(Dataset.id, datasetId)),
    })
    if (!dataset) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Dataset not found',
      })
    }

    return `workspaces/${workspaceId}/datasets/${datasetId}/${uuid()}/${sanitizeKey(filename)}`
  },
})

export const POST = async (request: NextRequest): Promise<Response> => {
  const { workspaceId, datasetId } = (await request.json()) as S3UploadParams

  const response = await _APIRoute(request)

  const { url } = (await response.json()) as { url: string }
  log.debug('S3 upload file', {
    workspaceId,
    datasetId,
    url,
  })

  return response
}
