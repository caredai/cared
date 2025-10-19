import { isRedirect, redirect } from '@tanstack/react-router'
import { createMiddleware, createStart } from '@tanstack/react-start'
import { getSessionCookie } from 'better-auth/cookies'

// TODO
// https://github.com/TanStack/router/issues/4460#issuecomment-3015836376
const convertRedirectErrorToExceptionMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await next()
  if ('error' in result && isRedirect(result.error)) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw result.error
  }
  return result
})

const globalMiddleware = createMiddleware()
  .middleware([convertRedirectErrorToExceptionMiddleware])
  .server(({ next, request }) => {
    const url = new URL(request.url)
    const pathname = url.pathname
    if (pathname === '/' || pathname.startsWith('/auth')) {
      return next()
    }

    if (pathname === '/chat') {
      throw redirect({
        // @ts-ignore
        to: '/chat',
      })
    }

    const sessionCookie = getSessionCookie(request, {
      cookiePrefix: 'cared',
    })
    const bearerToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!sessionCookie && !bearerToken) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirectTo: url.pathname + url.search,
        },
      })
    }

    if (pathname.startsWith('/chat')) {
      throw redirect({
        // @ts-ignore
        to: pathname,
      })
    }

    return next()
  })

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [globalMiddleware],
  }
})
