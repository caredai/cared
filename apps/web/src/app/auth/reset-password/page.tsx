import type { Metadata } from 'next'

import { ResetPassword } from '@/components/reset-password'

export const metadata: Metadata = {
  title: 'Reset password | Cared',
}

export default function Page() {
  return <ResetPassword />
}
