import { z } from 'zod/v4'

export const branchSearchSchema = z.object({
  branch: z.string().optional(),
})

export type BranchSearch = z.infer<typeof branchSearchSchema>
