import { redirect } from 'next/navigation'

import { prefetchAndCheckSession } from '@/lib/session'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AcceptInvitation } from './accept-invitation'

export default async function Page({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params

  // Redirect if no invitationId
  if (!invitationId) {
    redirect('/')
    return
  }

  if (
    !(await prefetchAndCheckSession(
      `/auth/sign-in?redirectTo=/org/accept-invitation/${invitationId}`,
    ))
  ) {
    return
  }

  prefetch(
    trpc.organization.getInvitation.queryOptions({
      invitationId,
    }),
  )

  return (
    <HydrateClient>
      <AcceptInvitation invitationId={invitationId} />
    </HydrateClient>
  )
}
