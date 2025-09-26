import { createFileRoute } from '@tanstack/react-router'

import { Tracing } from '@/components/tracing'

export const Route = createFileRoute('/account/tracing')({
  component: () => <Tracing scope="user" />,
})
