import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'

import type { auth } from '@mindworld/auth'

type Session = typeof auth.$Infer.Session

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/api/auth/get-session') {
    return NextResponse.next() // Skip the middleware for the get-session endpoint
  }

  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') ?? '', // Forward the cookies from the request
    },
  })

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Redirect to the homepage if the user is not an admin but tries
  // to access the admin page or auth api
  if (pathname === '/admin' || pathname.startsWith('/api/auth')) {
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
