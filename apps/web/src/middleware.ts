import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/trpc/user.session' ||
    (pathname.startsWith('/auth') && !pathname.startsWith('/auth/settings'))
  ) {
    return NextResponse.next() // Skip the middleware for the get-session endpoint
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'ownx',
  })
  if (!sessionCookie) {
    const redirectTo = request.nextUrl.pathname + request.nextUrl.search
    return NextResponse.redirect(new URL(`/auth/sign-in?redirectTo=${redirectTo}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
