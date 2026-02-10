import { randomBytes } from 'node:crypto'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { App } from 'octokit'

import { and, eq } from '@cared/db'
import { db } from '@cared/db/client'
import { Integration } from '@cared/db/schema'
import { getKV } from '@cared/kv'

import { env } from './env'

export class GithubIntegration {
  app = new App({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_PRIVATE_KEY,
    oauth: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    webhooks: {
      secret: env.GITHUB_WEBHOOK_SECRET,
    },
  })

  kv = getKV('integration::github')

  constructor() {
    this.#setupWebhooks()
  }

  static #instance: GithubIntegration | undefined
  static instance() {
    GithubIntegration.#instance ??= new GithubIntegration()
    return GithubIntegration.#instance
  }

  /**
   * Generate GitHub App installation URL with state parameter for security
   * @param accountId - The account ID to associate with the installation
   * @param redirectUrl - Optional redirect URL after installation
   * @returns Installation URL and state token
   */
  async generateInstallationUrl(
    accountId: string,
    redirectUrl?: string,
  ): Promise<{ url: string; state: string }> {
    // Generate a random state token for CSRF protection
    const state = randomBytes(32).toString('hex')

    // Store state in KV with accountId and redirectUrl, expires in 10 minutes
    await this.kv.set(
      `state:${state}`,
      JSON.stringify({ accountId, redirectUrl }),
      { ex: 600 }, // 10 minutes expiration
    )

    // Generate installation URL
    const urlResult = this.app.oauth.getWebFlowAuthorizationUrl({
      state,
      redirectUrl: `${env.VITE_API_URL}/v1/integration/github/setup/callback`,
    })

    return { url: urlResult.url, state }
  }

  /**
   * Get installation information by installation ID
   * @param installationId - GitHub installation ID
   * @returns Installation information
   */
  async getInstallation(installationId: number) {
    const octokit = await this.app.getInstallationOctokit(installationId)
    const { data: installation } = await octokit.rest.apps.getInstallation({
      installation_id: installationId,
    })
    return installation
  }

  #setupWebhooks() {
    this.app.webhooks.on('issues.opened', ({ octokit, payload }) => {
      return octokit.rest.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.issue.number,
        body: 'Hello, World!',
      })
    })
  }
}

/**
 * Handle GitHub App installation callback
 * Validates state, retrieves installation ID, and stores integration
 */
async function githubSetupCallback(c: Context) {
  const query = c.req.query()
  const installationId = query.installation_id
  const state = query.state

  if (!installationId) {
    return c.json({ error: 'Missing installation_id parameter' }, 400)
  }
  if (!state) {
    return c.json({ error: 'Missing state parameter' }, 400)
  }

  const github = GithubIntegration.instance()
  const { accountId, redirectUrl } = JSON.parse(
    (await github.kv.get(`state:${state}`)) ?? '{}',
  ) as {
    accountId: string
    redirectUrl?: string
  }
  if (!accountId) {
    return c.json({ error: 'Invalid or expired state' }, 400)
  }
  await github.kv.delete(`state:${state}`)

  const installationIdNumber = parseInt(installationId, 10)
  if (Number.isNaN(installationIdNumber)) {
    return c.json({ error: 'Invalid installation_id' }, 400)
  }

  // Get installation details
  const installation = await github.getInstallation(installationIdNumber)

  const existing = await db.query.Integration.findFirst({
    where: and(
      eq(Integration.type, 'github'),
      eq(Integration.identifier, installationIdNumber.toString()),
    ),
  })

  // Extract account information from installation
  const account = installation.account
  if (!account) {
    return c.json({ error: 'Installation account information not found' }, 400)
  }

  // Extract account information - account can be User or Organization
  // Both have login, but type field exists to distinguish them
  const accountType: 'User' | 'Organization' =
    (account as { type?: string }).type === 'User' ? 'User' : 'Organization'
  const accountLogin = (account as { login?: string }).login
  const accountName = (account as { name?: string }).name

  if (!accountLogin || !accountName) {
    return c.json({ error: 'Account login/name information not found' }, 400)
  }

  const integrationData = {
    accountId,
    type: 'github' as const,
    identifier: installationIdNumber.toString(),
    metadata: {
      type: 'github' as const,
      account: {
        type: accountType,
        login: accountLogin,
        name: accountName,
      },
    },
  }

  if (existing) {
    if (existing.accountId !== accountId) {
      return c.json({ error: 'Integration already exists for a different account' }, 400)
    }

    // Update existing integration
    await db
      .update(Integration)
      .set({
        metadata: integrationData.metadata,
      })
      .where(eq(Integration.id, existing.id))
  } else {
    // Create new integration
    await db.insert(Integration).values(integrationData)
  }

  return Response.redirect(redirectUrl ?? `${env.VITE_WEB_URL!}/${accountId}/integrations`, 302)
}

/**
 * Handle GitHub webhook events
 */
async function githubWebhook(c: Context) {
  const request = c.req
  const id = request.header('x-github-delivery')
  const name = request.header('x-github-event')
  const signature = request.header('x-hub-signature-256')
  if (!id || !name || !signature) {
    return c.text('Missing required headers', 400)
  }
  const payload = await request.text()

  await GithubIntegration.instance().app.webhooks.verifyAndReceive({
    id,
    name,
    signature,
    payload,
  })
  return c.text('Webhook received successfully', 200)
}

export function setupIntegrationGithubRoutes(app: Hono): void {
  const subapp = new Hono()
  subapp.get('/setup/callback', githubSetupCallback)
  subapp.post('/webhooks', githubWebhook)

  app.route('/v1/integrations/github', subapp)
}
