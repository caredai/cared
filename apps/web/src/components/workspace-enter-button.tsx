'use client'

import { useState } from 'react'
import { LogIn } from 'lucide-react'

import { SidebarMenuButton } from '@ownxai/ui/components/sidebar'

import { useRedirectWorkspace } from '@/hooks/use-workspace'

export function WorkspaceEnterButton() {
  const redirect = useRedirectWorkspace()
  const [isActive, setIsActive] = useState(false)

  return (
    <SidebarMenuButton
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      isActive={isActive}
      onClick={() => {
        redirect()
        setIsActive(true)
      }}
    >
      <LogIn />
      <span className="truncate">Go to workspace</span>
    </SidebarMenuButton>
  )
}
