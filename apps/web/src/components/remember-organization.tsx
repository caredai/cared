import { useEffect } from 'react'

import { useSetLastOrganization } from '@/hooks/use-organization'

export function RememberOrganization({ id }: { id?: string }) {
  const { setLastOrganization, disabledSetLastOrganization } = useSetLastOrganization()

  useEffect(() => {
    const remember = () => !disabledSetLastOrganization && void setLastOrganization(id)
    window.addEventListener('beforeunload', remember)
    return () => window.removeEventListener('beforeunload', remember)
  }, [id, setLastOrganization, disabledSetLastOrganization])

  return <></>
}

export function ForgetOrganization() {
  return <RememberOrganization />
}
