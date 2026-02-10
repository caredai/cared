import { decrypt as decrypt_, encrypt as encrypt_ } from '@cared/shared'

import { env } from './env'

export async function encrypt(key: string) {
  return await encrypt_(env.ENCRYPTION_KEY, key)
}

export async function decrypt(encryptedKey: string) {
  return await decrypt_(env.ENCRYPTION_KEY, encryptedKey)
}
