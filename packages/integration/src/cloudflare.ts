import Cloudflare from 'cloudflare'

import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Integration } from '@cared/db/schema'

import { decrypt, encrypt } from './utils'

export class CloudflareIntegration {
  // https://github.com/cloudflare/cloudflare-typescript
  // https://github.com/cloudflare/cloudflare-typescript/blob/main/api.md
  // https://developers.cloudflare.com/api
  client: Cloudflare

  constructor(apiToken: string) {
    this.client = new Cloudflare({ apiToken })
  }

  /**
   * Create or retrieve a Cloudflare integration
   * @param accountId - The account ID to associate with the integration
   * @param options - Either apiToken or identifier must be provided
   * @returns CloudflareIntegration instance
   */
  static async create(
    accountId: string,
    {
      apiToken,
      identifier,
    }: {
      apiToken?: string
      identifier?: string
    },
  ): Promise<CloudflareIntegration> {
    // If identifier is provided, retrieve existing integration from database
    if (identifier) {
      const existing = await db.query.Integration.findFirst({
        where: and(
          eq(Integration.type, 'cloudflare'),
          eq(Integration.identifier, identifier),
          eq(Integration.accountId, accountId),
        ),
      })

      if (!existing) {
        throw new Error(
          `Cloudflare integration with identifier ${identifier} not found for this account`,
        )
      }

      if (!existing.credentials) {
        throw new Error('Integration credentials not found')
      }

      const decryptedApiToken = await decrypt(existing.credentials)

      return new CloudflareIntegration(decryptedApiToken)
    }

    if (!apiToken) {
      throw new Error('Either apiToken or identifier must be provided')
    }
    // If apiToken is provided, fetch account ID from Cloudflare

    // Create Cloudflare client to fetch account ID
    const tempClient = new Cloudflare({
      apiToken,
    })

    // Fetch accounts from Cloudflare API
    const firstAccount = (await tempClient.accounts.list()).result.at(0)
    if (!firstAccount) {
      throw new Error('No Cloudflare accounts found for the provided API token')
    }

    // Encrypt and store the API token
    const encryptedCredentials = await encrypt(apiToken)

    // Check for existing integration with the same identifier
    const existing = await db.query.Integration.findFirst({
      where: and(eq(Integration.type, 'cloudflare'), eq(Integration.identifier, firstAccount.id)),
    })

    const integrationData = {
      accountId,
      type: 'cloudflare' as const,
      identifier: firstAccount.id,
      credentials: encryptedCredentials,
      metadata: {
        type: 'cloudflare' as const,
        accountName: firstAccount.name,
      },
    }

    if (existing) {
      // Check if it belongs to a different account
      if (existing.accountId !== accountId) {
        throw new Error('Integration already exists for a different account')
      }

      // Update existing integration
      await db
        .update(Integration)
        .set({
          credentials: encryptedCredentials,
          metadata: integrationData.metadata,
        })
        .where(eq(Integration.id, existing.id))
    } else {
      // Create new integration
      await db.insert(Integration).values(integrationData)
    }

    // Create and return CloudflareIntegration instance
    return new CloudflareIntegration(apiToken)
  }
}
