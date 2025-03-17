import { db } from '@mindworld/db/client'
import { Membership, User, Workspace } from '@mindworld/db/schema'

import { users } from './users'
import { workspaces } from './workspaces'

export async function mock(userId: string) {
  console.log('Starting to insert mock data...')

  // Insert all users
  console.log(`Inserting ${users.length} users...`)
  const userValues = users.map((user) => ({
    id: user.id,
    info: user.info as any,
  }))

  await db.insert(User).values(userValues)

  // Insert all workspaces
  console.log(`Inserting ${workspaces.length} workspaces...`)
  const workspaceValues = workspaces.map((workspace) => ({
    name: workspace.name,
  }))

  const insertedWorkspaces = await db.insert(Workspace).values(workspaceValues).returning()

  console.log('Creating associations between users and workspaces...')

  // Insert owner relationships
  const ownerMemberships = insertedWorkspaces.map((workspace) => ({
    workspaceId: workspace.id,
    userId: userId,
    role: 'owner' as const,
  }))

  await db.insert(Membership).values(ownerMemberships)

  // Insert member relationships
  const memberMemberships = []
  for (let i = 1; i < Math.min(users.length, 10); i++) {
    const memberId = users[i]!.id
    const workspace = insertedWorkspaces[i % insertedWorkspaces.length]!

    memberMemberships.push({
      workspaceId: workspace.id,
      userId: memberId,
      role: 'member' as const,
    })
  }

  await db.insert(Membership).values(memberMemberships)

  console.log('Mock data insertion completed!')
}
