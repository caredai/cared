import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SearchSchemaInput } from '@tanstack/react-router'
import { ForgotPassword } from '@/components/forgot-password'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/auth/forgot-password')({
  validateSearch: (search: Record<string, string> & SearchSchemaInput) => ({
    redirectTo: search.redirectTo ?? '/',
  }),
  component: Page,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(
      orpc.user.session.queryOptions({
        input: {
          auth: false,
        },
      }),
    )

    if (session) {
      throw redirect({ to: search.redirectTo })
    }

    return { session }
  },
  head: () => ({
    meta: [
      {
        title: 'Forgot password | Cared',
      },
    ],
  }),
})

function Page() {
  return <ForgotPassword />
}
