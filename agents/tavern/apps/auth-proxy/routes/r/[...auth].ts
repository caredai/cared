import { Auth } from '@auth/core'
import { eventHandler, toWebRequest } from 'h3'

export default eventHandler(async (event) =>
  Auth(toWebRequest(event), {
    basePath: '/r',
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      {
        id: 'mind',
        name: 'Mind AI',
        type: 'oidc',
        issuer: process.env.AUTH_MIND_ISSUER,
        clientId: process.env.AUTH_MIND_ID,
        clientSecret: process.env.AUTH_MIND_SECRET,
      },
    ],
  }),
)
