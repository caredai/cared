'use client'

import { LogIn } from 'lucide-react'

import { SidebarMenuButton } from '@ownxai/ui/components/sidebar'

import { useRedirectWorkspace } from '@/hooks/use-workspace'

export function WorkspaceEnterButton() {
  const redirect = useRedirectWorkspace()

  return (
    <SidebarMenuButton
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      onClick={redirect}
    >
      <LogIn />
      <span className="truncate">Go to workspace</span>
    </SidebarMenuButton>
  )
}
