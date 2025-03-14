import type { ReactNode } from 'react'

import { useHasMounted } from '@/hooks/use-has-mounted'

// See:
// - https://www.joshwcomeau.com/react/the-perils-of-rehydration/#abstractions
// - https://jotai.org/docs/utilities/storage#server-side-rendering
export function ClientOnly({ children }: { children: ReactNode }) {
  const hasMounted = useHasMounted()
  if (!hasMounted) {
    return null
  }
  return <>{children}</>
}
