import { clerkClient } from '@clerk/nextjs/server'

async function getOauthApp(appId: string) {
  const client = await clerkClient()
  client.__experimental_accountlessApplications
}

  export const oauthAppRouter = {
}
