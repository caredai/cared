import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@ownxai/api'
import { getBaseUrl } from '@ownxai/auth/client'

export const GET = () => {
  const baseUrl = getBaseUrl()
  const openApiDocument = generateOpenApiDocument(baseUrl + '/api', baseUrl + '/api/openapi.json')
  return NextResponse.json(openApiDocument)
}
