'use client'

import { useState } from 'react'
import {
  faAddressCard,
  faBars,
  faBookAtlas,
  faCubes,
  faFaceSmile,
  faFont,
  faMagicWandSparkles,
  faPanorama,
  faPaperPlane,
  faPlug,
  // faPlugCircleExclamation,
  faSliders,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { cn } from '@ownxai/ui/lib/utils'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'

export function Content() {
  const [openItem, setOpenItem] = useState<string | null>(null)

  const toggleItem = (itemName: string) => {
    setOpenItem((prev) => (prev === itemName ? null : itemName))
  }

  const navSettings = [
    { icon: faSliders, name: 'settings' },
    { icon: faPlug, name: 'plugins' },
    { icon: faFont, name: 'fonts' },
    { icon: faBookAtlas, name: 'library' },
    { icon: faUserCog, name: 'profile' },
    { icon: faPanorama, name: 'gallery' },
    { icon: faCubes, name: 'blocks' },
    { icon: faFaceSmile, name: 'emojis' },
    { icon: faAddressCard, name: 'contacts' },
  ]

  return (
    <div
      className="h-screen w-full flex justify-center bg-cover bg-no-repeat"
      style={{
        backgroundImage: 'url("/images/bedroom cyberpunk.jpg")',
      }}
    >
      <div className="w-full lg:w-1/2 h-full flex flex-col relative">
        <header className="bg-zinc-800 text-white flex flex-col shadow-[0_2px_20px_rgba(0,0,0,0.7)] z-3000">
          <nav className="w-full flex flex-row items-center justify-between px-4 h-[35px] relative">
            {navSettings.map(({ icon, name }, index) => (
              <Collapsible
                key={name}
                open={openItem === name}
                onOpenChange={() => toggleItem(name)}
              >
                <CollapsibleTrigger asChild>
                  <button>
                    <FontAwesomeIcon
                      icon={icon}
                      size="2x"
                      className="fa-fw text-ring hover:text-foreground transition-colors duration-200"
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className={cn(
                    'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden bg-zinc-800 rounded-lg shadow-lg',
                    'absolute top-[35px] left-0 right-0 w-full',
                    (index === 0 || index === navSettings.length - 1) &&
                      'lg:fixed lg:top-0 lg:w-[calc(25%-1px)]',
                    index === 0
                      ? 'lg:right-auto'
                      : index === navSettings.length - 1
                        ? 'lg:left-auto'
                        : undefined,
                  )}
                >
                  <div className="p-4 text-white">
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                    {name.charAt(0).toUpperCase() + name.slice(1)} Panel Content
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </nav>
        </header>

        <main className="flex-1 bg-zinc-900 overflow-y-auto p-4"></main>

        <div className="pt-[1px] pb-[5px] bg-transparent">
          <div className="flex flex-row items-center bg-zinc-900 rounded-b-lg px-1 text-sm focus-within:ring-1 focus-within:ring-ring">
            <button className="inline-flex">
              <FontAwesomeIcon
                icon={faBars}
                size="2x"
                className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
              />
            </button>
            <button className="inline-flex">
              <FontAwesomeIcon
                icon={faMagicWandSparkles}
                size="2x"
                className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
              />
            </button>
            <AutoGrowTextarea
              className="flex-1 min-h-[36px] max-h-[50dvh] text-white focus:outline-none border-0 focus-visible:ring-0 resize-y rounded-none"
              placeholder="Type your message..."
            />
            <button className="inline-flex ml-1">
              <FontAwesomeIcon
                icon={faPaperPlane}
                size="2x"
                className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
