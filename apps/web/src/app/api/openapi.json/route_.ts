import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@cared/api'
import { getBaseUrl } from '@cared/auth/client'

export const GET = () => {
  const baseUrl = getBaseUrl()
  const openApiDocument = generateOpenApiDocument(baseUrl + '/api', baseUrl + '/api/openapi.json')
  return NextResponse.json(openApiDocument)
}
