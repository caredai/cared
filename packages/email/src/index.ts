import type {
  CreateEmailOptions,
  CreateEmailRequestOptions,
  CreateEmailResponse,
  ErrorResponse,
  GetEmailResponse,
} from 'resend'
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

let resend: Resend | undefined

function getResend() {
  resend ??= new Resend(env.RESEND_API_KEY)
  return resend
}

export class Emails {
  send(
    payload: CreateEmailOptions,
    options?: CreateEmailRequestOptions,
  ): Promise<CreateEmailResponse> {
    return getResend().emails.send(payload, options)
  }

  get(id: string): Promise<GetEmailResponse> {
    return getResend().emails.get(id)
  }

  update(payload: UpdateEmailOptions): Promise<UpdateEmailResponse> {
    return getResend().emails.update(payload)
  }

  cancel(id: string): Promise<CancelEmailResponse> {
    return getResend().emails.cancel(id)
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
