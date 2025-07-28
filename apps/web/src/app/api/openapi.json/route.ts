import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@cared/api'
import { getBaseUrl } from '@cared/auth/client'

// TODO: fix generateOpenApiDocument error
export const dynamic = 'force-dynamic'

export const GET = () => {
  const baseUrl = getBaseUrl()
  const openApiDocument = generateOpenApiDocument(baseUrl + '/api', baseUrl + '/api/openapi.json')
  return NextResponse.json(openApiDocument)
}
