import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import type { API } from '../types/api'

export { API }
// @ts-ignore
export type RouterInputs = inferRouterInputs<API>
// @ts-ignore
export type RouterOutputs = inferRouterOutputs<API>
