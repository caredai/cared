'use client'

import { useEffect } from 'react'

import { useSetLastOrganization } from '@/hooks/use-organization'

export function RememberOrganization({ id }: { id?: string }) {
  const setLastOrganization = useSetLastOrganization()

  useEffect(() => {
    const remember = () => void setLastOrganization(id)
    window.addEventListener('beforeunload', remember)
    return () => window.removeEventListener('beforeunload', remember)
  }, [id, setLastOrganization])

  return <></>
}

export function ForgetOrganization() {
  return <RememberOrganization />
}
