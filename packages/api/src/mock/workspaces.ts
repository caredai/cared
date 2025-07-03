import type { z } from 'zod/v4'

import type { CreateWorkspaceSchema } from '@ownxai/db/schema'

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
