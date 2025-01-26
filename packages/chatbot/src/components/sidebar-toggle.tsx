import type { ComponentProps } from 'react'

import type { SidebarTrigger } from '@mindworld/ui/components/sidebar'
import { Button } from '@mindworld/ui/components/button'
import { useSidebar } from '@mindworld/ui/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@mindworld/ui/components/tooltip'

import { SidebarLeftIcon } from './icons'

export function SidebarToggle(_props: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={toggleSidebar} variant="outline" className="md:px-2 md:h-fit">
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  )
}
