import type { ComponentPropsWithoutRef } from 'react'
import { SiDiscord, SiGithub, SiX } from '@icons-pack/react-simple-icons'
import { GraduationCap } from 'lucide-react'

import { SidebarGroup, SidebarGroupContent } from '@mindworld/ui/components/sidebar'

import { siteConfig } from '@/config/site'

export function NavSecondary({ ...props }: ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <div className="mt-4 flex items-center justify-center gap-4">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <GraduationCap size={24} />
            <span className="sr-only">Docs</span>
          </a>
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SiX size={20} />
            <span className="sr-only">X (Twitter)</span>
          </a>
          <a
            href={siteConfig.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SiDiscord size={20} />
            <span className="sr-only">Discord</span>
          </a>
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SiGithub size={20} />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
