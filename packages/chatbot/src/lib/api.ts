import type { createTRPCReact } from '@trpc/react-query'
import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

import type { AppRouter } from '@mindworld/api'

export type API = ReturnType<typeof createTRPCReact<AppRouter>>

const apiAtom = atom<API>()
const getAPIAtom = atom((get) => get(apiAtom))
const setAPIAtom = atom(null, (get, set, api: API) => {
  set(apiAtom, api)
})

export function useAPI() {
  const [api] = useAtom(getAPIAtom)
  if (!api) {
    throw new Error('API not set')
  }
  return api
}

export function useSetAPI(api: API) {
  const [, setAPI] = useAtom(setAPIAtom)
  useEffect(() => {
    setAPI(api)
  }, [api])
}
