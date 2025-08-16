import { redirect } from 'next/navigation'

import { SignInUp } from '@/components/sign-in-up'
import { fetch, trpc } from '@/trpc/server'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
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

  return <SignInUp mode="sign-up" />
}
