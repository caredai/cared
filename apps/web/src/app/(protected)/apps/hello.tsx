'use client'

import { useWorkspaces } from "@/hooks/use-workspace"

export function Hello() {
  const workspaces = useWorkspaces()
  console.log(workspaces)

  return <div>Hello</div>
}
