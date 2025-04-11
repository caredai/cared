'use client'

import { useEffect, useRef, useState } from 'react'
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
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { cn } from '@ownxai/ui/lib/utils'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'
import { FaButton } from '@/components/fa-button'
import { useTRPC } from '@/trpc/client'
import { backgroundFittings, BackgroundImagePanel } from './_panels/background-image'
import { CharacterManagementPanel } from './_panels/character-management'
import { ExtensionsPanel } from './_panels/extensions'
import { PersonaManagementPanel } from './_panels/persona-management'
import { ProviderModelPanel } from './_panels/provider-model'
// Import panel components
import { ResponseConfigurationPanel } from './_panels/response-configuration'
import { ResponseFormattingPanel } from './_panels/response-formatting'
import { UserSettingsPanel } from './_panels/user-settings'
import { WorldInfoPanel } from './_panels/world-info'

export function Content() {
  const trpc = useTRPC()
  const {
    data: { settings },
  } = useSuspenseQuery(trpc.settings.get.queryOptions())

  const [openItem, setOpenItem] = useState<string | null>(null)

  // Create refs object to store all panel refs
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openItem) return

      const panel = panelRefs.current[openItem]
      const trigger = triggerRefs.current[openItem]

      if (panel && trigger) {
        const target = event.target as Node
        if (!panel.contains(target) && !trigger.contains(target)) {
          setOpenItem(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openItem])

  const toggleItem = (itemName: string) => {
    setOpenItem((prev) => (prev === itemName ? null : itemName))
  }

  const navPanels = [
    { icon: faSliders, name: 'response-configuration', panel: ResponseConfigurationPanel },
    { icon: faPlug, name: 'provider-model', panel: ProviderModelPanel },
    { icon: faFont, name: 'response-formatting', panel: ResponseFormattingPanel },
    { icon: faBookAtlas, name: 'world-info', panel: WorldInfoPanel },
    { icon: faUserCog, name: 'user-settings', panel: UserSettingsPanel },
    { icon: faPanorama, name: 'background-image', panel: BackgroundImagePanel },
    { icon: faCubes, name: 'extensions', panel: ExtensionsPanel },
    { icon: faFaceSmile, name: 'persona-management', panel: PersonaManagementPanel },
    { icon: faAddressCard, name: 'character-management', panel: CharacterManagementPanel },
  ]

  return (
    <div
      className={cn(
        'h-screen w-full flex justify-center bg-no-repeat',
        backgroundFittings[settings.background.fitting],
      )}
      style={{
        backgroundImage: `url("${settings.background.active.url}")`,
      }}
    >
      <div className="w-full lg:w-1/2 h-full flex flex-col relative">
        <header className="bg-zinc-800 text-white flex flex-col shadow-[0_2px_20px_rgba(0,0,0,0.7)] z-3000">
          <nav className="w-full flex flex-row items-center justify-between px-4 h-[35px] relative">
            {navPanels.map(({ icon, name, panel: Panel }, index) => (
              <Collapsible
                key={name}
                open={openItem === name}
                onOpenChange={() => toggleItem(name)}
                className="size-8"
              >
                <CollapsibleTrigger asChild>
                  <FaButton
                    ref={(el) => {
                      triggerRefs.current[name] = el
                    }}
                    icon={icon}
                    isActive={openItem === name}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent
                  ref={(el) => {
                    panelRefs.current[name] = el
                  }}
                  className={cn(
                    'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
                    'bg-zinc-800 border border-background rounded-lg shadow-lg',
                    'absolute top-[35px] left-0 right-0 w-full',
                    'max-h-[calc(100dvh-calc(35px+42px))] overflow-y-auto',
                    (index === 0 || index === navPanels.length - 1) &&
                      'lg:fixed lg:top-0 lg:w-[calc(25%-1px)]',
                    index === 0
                      ? 'lg:right-auto'
                      : index === navPanels.length - 1
                        ? 'lg:left-auto'
                        : undefined,
                  )}
                >
                  <div className="p-4 text-white">
                    <Panel />
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
