import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function useSession() {
  const trpc = useTRPC()
  const { data: session } = useQuery(trpc.user.session.queryOptions())

  return {
    session: session?.session,
    user: session?.user,
  }
}
