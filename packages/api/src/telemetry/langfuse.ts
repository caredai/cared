import { LangfuseSpanProcessor } from '@langfuse/otel'
import { NodeSDK } from '@opentelemetry/sdk-node'

import type { ShouldExportSpan } from '@langfuse/otel'

const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== 'next.js'
}

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
})

export function registerTelemetry() {
  const sdk = new NodeSDK({
    spanProcessors: [langfuseSpanProcessor],
  })

  sdk.start()
}
