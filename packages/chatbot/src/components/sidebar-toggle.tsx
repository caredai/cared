import type { ComponentProps } from 'react'

import type { SidebarTrigger } from '@ownxai/ui/components/sidebar'
import { Button } from '@ownxai/ui/components/button'
import { useSidebar } from '@ownxai/ui/components/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ownxai/ui/components/tooltip'

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
