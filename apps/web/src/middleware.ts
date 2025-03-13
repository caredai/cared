import { NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

import { authForApi, authForUser } from '@mindworld/api/auth'

const isPublicRoute = createRouteMatcher(['/'])
const isApiRoute = createRouteMatcher(['/api/(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    const { userId } = await auth()
    if (userId) {
      // redirect to /apps if user is signed in
      return NextResponse.redirect(new URL('/apps', request.url))
    }

    // public landing page
    return
  }

  if (isApiRoute(request)) {
    // auth for api
    const r = await authForApi()
    if (r instanceof Response) {
      return r
    } else if (r) {
      return
    }
  }

  // auth for user
  await auth.protect()

  const r = await authForUser()
  if (r instanceof Response) {
    return r
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
