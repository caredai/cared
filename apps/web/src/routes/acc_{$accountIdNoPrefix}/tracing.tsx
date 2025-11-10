import { createFileRoute } from '@tanstack/react-router'

import { TracingWithSelector } from '@/components/tracing'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/tracing')({
  component: TracingPage,
})

function TracingPage() {
  return <TracingWithSelector />
}
