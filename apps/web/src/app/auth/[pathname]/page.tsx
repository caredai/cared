import { AuthCard } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

export function generateStaticParams() {
  return Object.values(authViewPaths).map((pathname) => ({ pathname }))
}

export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  const { pathname } = await params

  return (
    <main className="min-h-svh flex flex-col grow p-4 items-center justify-center">
      <AuthCard pathname={pathname} />
    </main>
  )
}
