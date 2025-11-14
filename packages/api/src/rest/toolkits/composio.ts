import type { Context } from 'hono'

export function GET(c: Context): Response {
  const composioEndpoint = 'https://backend.composio.dev/api/v3/toolkits/auth/callback'

  // Extract and preserve all query parameters
  const queryParams = new URL(c.req.url).searchParams
  // Redirect to Composio with all query parameters intact
  const redirectUrl = `${composioEndpoint}?${queryParams.toString()}`

  return c.redirect(redirectUrl, 302)
}
