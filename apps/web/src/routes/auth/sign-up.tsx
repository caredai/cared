import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignInUp } from '@/components/sign-in-up'
import { orpc } from '@/lib/orpc'

export const Route = createFileRoute('/auth/sign-up')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: (search.redirectTo ?? '/') as string,
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
        title: 'Sign up | Cared',
      },
    ],
  }),
  component: () => <SignInUp mode="sign-up" />,
})
