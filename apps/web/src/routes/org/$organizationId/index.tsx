import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/org/$organizationId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/org/$organizationId/workspaces`,
      params: { organizationId: params.organizationId },
    })
  },
})
