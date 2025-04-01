import { headers } from 'next/headers'
import { auth } from '@tavern/auth'

import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { AuthShowcase } from './_components/auth-showcase'

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user) {
    prefetch(trpc.user.me.queryOptions())
    prefetch(trpc.user.session.queryOptions())
  }

  return (
    <HydrateClient>
      <main className="container h-screen py-16">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-primary">T3</span> Turbo
          </h1>
          <AuthShowcase session={session ?? undefined} />
        </div>
      </main>
    </HydrateClient>
  )
}
