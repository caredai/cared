import type { ErrorResponse } from 'resend'
import { Resend } from 'resend'

import { env } from './env'

interface UpdateEmailOptions {
  id: string
  scheduledAt: string
}

interface UpdateEmailResponseSuccess {
  id: string
  object: 'email'
}

type UpdateEmailResponse =
  | {
      data: UpdateEmailResponseSuccess
      error: null
    }
  | {
      data: null
      error: ErrorResponse
    }

interface CancelEmailResponseSuccess {
  object: 'email'
  id: string
}

type CancelEmailResponse =
  | {
      data: CancelEmailResponseSuccess
      error: null
    }
  | {
      data: null
      error: ErrorResponse
    }

const resend = new Resend(env.RESEND_API_KEY)

export class Emails {
  send = resend.emails.send.bind(resend.emails)

  get = resend.emails.get.bind(resend.emails)

  update(payload: UpdateEmailOptions): Promise<UpdateEmailResponse> {
    return resend.emails.update(payload)
  }

  cancel(id: string): Promise<CancelEmailResponse> {
    return resend.emails.cancel(id)
  }
}

export const emails = new Emails()

const domain = env.RESEND_DOMAIN ?? 'cared.dev'

export function getEmailAddresses({ from, replyTo }: { from: string; replyTo?: string }) {
  return {
    from: `${from}@${domain}`,
    replyTo: replyTo ? `${replyTo}@${domain}` : undefined,
    support: `support@${domain}`,
  }
}
