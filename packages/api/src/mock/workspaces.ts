import type { z } from 'zod'

import type { CreateWorkspaceSchema } from '@mindworld/db/schema'

export const workspaces: z.infer<typeof CreateWorkspaceSchema>[] = [
  {
    name: 'Marketing Team',
  },
  {
    name: 'Team Project Alpha',
  },
  {
    name: 'Research & Development',
  },
  {
    name: 'Marketing Campaign',
  },
  {
    name: 'Product Design',
  },
  {
    name: 'Client Collaboration',
  },
  {
    name: 'Strategic Planning',
  },
  {
    name: 'Content Creation',
  },
  {
    name: 'Data Analysis',
  },
  {
    name: 'Innovation Lab',
  },
]
