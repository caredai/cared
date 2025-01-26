import type { createTRPCReact } from '@trpc/react-query'

import type { AppRouter } from '@mindworld/api'

export type Api = ReturnType<typeof createTRPCReact<AppRouter>>
