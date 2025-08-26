import type { ProviderKey as ProviderKeyContent } from '@cared/providers'
import { googleServiceAccountSchema } from '@cared/providers'
import { decrypt as decrypt_, encrypt as encrypt_ } from '@cared/shared'

import { env } from '../../env'

async function encrypt(key: string) {
  return await encrypt_(env.ENCRYPTION_KEY, key)
}

async function decrypt(encryptedKey: string) {
  return await decrypt_(env.ENCRYPTION_KEY, encryptedKey)
}

async function decryptToStart(encryptedKey: string, length = 6) {
  return (await decrypt(encryptedKey)).slice(0, length)
}

export async function encryptProviderKey(key: ProviderKeyContent): Promise<ProviderKeyContent> {
  const k = { ...key }

  switch (k.providerId) {
    case 'azure':
      k.apiKey = await encrypt(k.apiKey)
      break
    case 'bedrock':
      k.accessKeyId = await encrypt(k.accessKeyId)
      k.secretAccessKey = await encrypt(k.secretAccessKey)
      break
    case 'vertex':
      {
        const serviceAccount = JSON.parse(k.serviceAccountJson)
        const result = googleServiceAccountSchema.safeParse(serviceAccount)
        if (!result.success) {
          throw new Error('Invalid service account JSON format')
        }

        k.serviceAccountJson = await encrypt(JSON.stringify(serviceAccount))
      }
      break
    case 'replicate':
      k.apiToken = await encrypt(k.apiToken)
      break
    default:
      k.apiKey = await encrypt(k.apiKey)
      break
  }

  return k
}

export async function decryptProviderKey(
  key: ProviderKeyContent,
  full?: boolean,
): Promise<ProviderKeyContent> {
  const k = { ...key }

  const decryptFn = full ? decrypt : decryptToStart

  switch (k.providerId) {
    case 'azure':
      k.apiKey = await decryptFn(k.apiKey)
      break
    case 'bedrock':
      k.accessKeyId = await decryptFn(k.accessKeyId)
      k.secretAccessKey = await decryptFn(k.secretAccessKey)
      break
    case 'vertex':
      k.serviceAccountJson = await decryptFn(k.serviceAccountJson)
      break
    case 'replicate':
      k.apiToken = await decryptFn(k.apiToken)
      break
    default:
      k.apiKey = await decryptFn(k.apiKey)
      break
  }

  return k
}
