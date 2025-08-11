import { z } from 'zod/v4'

export const workspaceNameSchema = z
  .string()
  .min(1, 'Workspace name cannot be empty')
  .max(255, 'Workspace name cannot be longer than 255 characters')

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  organizationId: z.string().min(1, 'Organization ID is required'),
})

export const updateWorkspaceSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: workspaceNameSchema,
})
