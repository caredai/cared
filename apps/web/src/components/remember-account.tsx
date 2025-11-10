import { useEffect } from 'react'

import { useSetLastAccount } from '@/hooks/use-account'

export function RememberAccount({ id }: { id: string }) {
  const { setLastAccount, disabledSetLastAccount } = useSetLastAccount()

  useEffect(() => {
    const remember = () => !disabledSetLastAccount && void setLastAccount(id)
    window.addEventListener('beforeunload', remember)
    return () => window.removeEventListener('beforeunload', remember)
  }, [id, setLastAccount, disabledSetLastAccount])

  return <></>
}
