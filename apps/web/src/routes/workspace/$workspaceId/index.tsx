import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/workspace/$workspaceId/apps`,
      params,
    })
  },
})
