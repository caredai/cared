import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ForgotPassword } from '@/components/forgot-password'
import { fetch, HydrateClient, trpc } from '@/trpc/server'

export const metadata: Metadata = {
  title: 'Forgot password | Cared',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const redirectToUrl = (await searchParams).redirectTo ?? '/'

  const session = await fetch(
    trpc.user.session.queryOptions({
      auth: false,
    }),
  )
  if (session) {
    redirect(redirectToUrl)
  }

  return (
    <HydrateClient>
      <ForgotPassword />
    </HydrateClient>
  )
}
