import { redirect } from 'next/navigation'

import { prefetchAndCheckSession } from '@/lib/session'
import { AcceptInvitation } from './accept-invitation'
import { HydrateClient, orpc, prefetch } from '@/orpc/client'

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
    orpc.organization.getInvitation.queryOptions({
      invitationId,
    }),
  )

  return (
    <HydrateClient>
      <AcceptInvitation invitationId={invitationId} />
    </HydrateClient>
  )
}
