import { redirect } from '@tanstack/react-router'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { getSessionCookie } from 'better-auth/cookies'

const globalMiddleware = createMiddleware().server(({ next, request }) => {
  const url = new URL(request.url)
  const pathname = url.pathname
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return next()
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'cared',
  })
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!sessionCookie && !token) {
    throw redirect({
      to: '/auth/sign-in',
      search: {
        redirectTo: url.pathname + url.search,
      },
    })
  }

  return next()
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [globalMiddleware],
  }
})
