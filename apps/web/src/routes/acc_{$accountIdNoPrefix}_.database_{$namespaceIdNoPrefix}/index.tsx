import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}_/database_{$namespaceIdNoPrefix}/')(
  {
    beforeLoad: ({ params }) => {
      throw redirect({
        to: '/acc_{$accountIdNoPrefix}/database_{$namespaceIdNoPrefix}/dashboard',
        params: {
          accountIdNoPrefix: params.accountIdNoPrefix,
          namespaceIdNoPrefix: params.namespaceIdNoPrefix,
        },
      })
    },
  },
)
