import { createFileRoute } from '@tanstack/react-router'

import { ResetPassword } from '@/components/reset-password'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, string>) => ({
    token: search.token,
    error: search.error,
  }),
  head: () => ({
    meta: [
      {
        title: 'Reset password | Cared',
      },
    ],
  }),
  component: Page,
})

function Page() {
  return <ResetPassword />
}
