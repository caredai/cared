import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@ownxai/api'
import { getBaseUrl } from '@ownxai/auth/client'

// TODO: fix generateOpenApiDocument error
export const dynamic = 'force-dynamic'

export const GET = () => {
  const baseUrl = getBaseUrl()
  const openApiDocument = generateOpenApiDocument(baseUrl + '/api', baseUrl + '/api/openapi.json')
  return NextResponse.json(openApiDocument)
}
