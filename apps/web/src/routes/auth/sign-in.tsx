import { createFileRoute, redirect } from '@tanstack/react-router'

import type { SearchSchemaInput } from '@tanstack/react-router'
import { SignInUp } from '@/components/sign-in-up'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/auth/sign-in')({
  validateSearch: (search: Record<string, string> & SearchSchemaInput) => ({
    redirectTo: search.redirectTo ?? '/',
  }),
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
        title: 'Sign in | Cared',
      },
    ],
  }),
  component: () => <SignInUp mode="sign-in" />,
})
