import { authClient } from '@tavern/auth/client'

export async function signIn() {
  const rep = await authClient.signIn.oauth2({
    providerId: 'cared',
    callbackURL: '/', // the path to redirect to after the user is authenticated
  })
  console.log(rep.data, rep.error)
}
