import { cache } from 'react'
import { createHydrationHelpers } from '@trpc/react-query/rsc'

import type { AppRouter } from '@mindworld/api'
import { createCaller, createContextForRsc } from '@mindworld/api'

import { createQueryClient } from './query-client'

const getQueryClient = cache(createQueryClient)
const caller = createCaller(createContextForRsc)

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
)
