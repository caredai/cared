import { addIdPrefix } from '@/lib/utils'

export async function getActiveAccountId(
  params:
    | { accountIdNoPrefix: string }
    | Promise<{
        accountIdNoPrefix: string
      }>,
) {
  const { accountIdNoPrefix: activeAccountIdNoPrefix } = await params
  const activeAccountId = addIdPrefix(activeAccountIdNoPrefix, 'acc')
  return {
    activeAccountId,
    activeAccountIdNoPrefix,
  }
}
