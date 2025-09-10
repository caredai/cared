import { LangfuseSpanProcessor } from '@langfuse/otel'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

import type { ShouldExportSpan } from '@langfuse/otel'

export async function register() {
  if (
    // eslint-disable-next-line no-restricted-properties
    process.env.NODE_ENV === 'development' &&
    // eslint-disable-next-line no-restricted-properties
    process.env.NEXT_RUNTIME === 'nodejs' &&
    typeof window === 'undefined'
  ) {
    await import('@/lib/proxy')
  }
}

const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== 'next.js'
}

const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
})

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
})

tracerProvider.register()
