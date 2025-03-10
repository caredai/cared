import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

import { authenticateForApi } from '@mindworld/api'

const isPublicRoute = createRouteMatcher(['/'])
const isApiRoute = createRouteMatcher(['/api/trpc/(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isApiRoute(request)) {
    const r = await authenticateForApi()
    if (r instanceof Response) {
      return r
    }
  } else if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
