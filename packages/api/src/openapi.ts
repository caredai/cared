import { generateOpenApiDocument as _generateOpenApiDocument } from 'trpc-to-openapi'

import { appRouter } from './root'

export function generateOpenApiDocument(baseUrl: string, docsUrl: string) {
  return _generateOpenApiDocument(appRouter, {
    title: 'OWNX API',
    description: 'OpenAPI compliant REST API built using tRPC with Next.js',
    version: '1.0.0',
    baseUrl,
    docsUrl,
  })
}
