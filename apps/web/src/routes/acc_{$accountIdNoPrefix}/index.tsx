import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/acc_{$accountIdNoPrefix}/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: `/acc_{$accountIdNoPrefix}/credits`,
      params: { accountIdNoPrefix: params.accountIdNoPrefix },
    })
  },
})
