import { redirect } from 'next/navigation'

import { fetch, HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AcceptInvitation } from './accept-invitation'

export default async function Page({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params

  // Redirect if no invitationId
  if (!invitationId) {
    redirect('/')
  }

  const session = await fetch(
    trpc.user.session.queryOptions({
      auth: false,
    }),
  )
  if (!session) {
    redirect(`/auth/sign-in?redirectTo=/org/accept-invitation/${invitationId}`)
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
