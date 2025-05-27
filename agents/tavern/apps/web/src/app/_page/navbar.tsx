'use client'

import { useEffect, useRef, useState } from 'react'
import {
  faAddressCard,
  faBookAtlas,
  faCubes,
  faFaceSmile,
  faFont,
  faPanorama,
  faPlug,
  // faPlugCircleExclamation,
  faSliders,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ownxai/ui/components/collapsible'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useAppearanceSettings } from '@/lib/settings'
import { BackgroundImagePanel } from '../_panels/background-image'
import { CharacterManagementPanel } from '../_panels/character-management'
import { ExtensionsPanel } from '../_panels/extensions'
import { ModelConfigurationPanel } from '../_panels/model-configuration'
import { PersonaManagementPanel } from '../_panels/persona-management'
import { ProviderModelPanel } from '../_panels/provider-model'
import { ResponseFormattingPanel } from '../_panels/response-formatting'
import { UserSettingsPanel } from '../_panels/user-settings'
import { LorebookPanel } from '../_panels/lorebook'

// Define navigation panel configuration
const navPanels = [
  { icon: faSliders, name: 'response-configuration', panel: ModelConfigurationPanel },
  { icon: faPlug, name: 'provider-model', panel: ProviderModelPanel },
  { icon: faFont, name: 'response-formatting', panel: ResponseFormattingPanel },
  { icon: faBookAtlas, name: 'lorebook', panel: LorebookPanel },
  { icon: faUserCog, name: 'user-settings', panel: UserSettingsPanel },
  { icon: faPanorama, name: 'background-image', panel: BackgroundImagePanel },
  { icon: faCubes, name: 'extensions', panel: ExtensionsPanel },
  { icon: faFaceSmile, name: 'persona-management', panel: PersonaManagementPanel },
  { icon: faAddressCard, name: 'character-management', panel: CharacterManagementPanel },
] as const

export function Navbar() {
  const appearanceSettings = useAppearanceSettings()

  // Use Set to track multiple open panels instead of a single openItem
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())

  // Create refs object to store all panel refs
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Initialize panels - automatically open locked panels when component mounts
  useEffect(() => {
    const leftPanelName = navPanels[0].name
    const rightPanelName = navPanels.at(-1)!.name

    setOpenPanels((prev) => {
      const newSet = new Set(prev)

      // Open left panel if locked
      if (appearanceSettings.leftNavPanelLocked) {
        newSet.add(leftPanelName)
      }

      // Open right panel if locked
      if (appearanceSettings.rightNavPanelLocked) {
        newSet.add(rightPanelName)
      }

      return newSet
    })
  }, [appearanceSettings.leftNavPanelLocked, appearanceSettings.rightNavPanelLocked])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Skip if no panels are open
      if (openPanels.size === 0) return

      // Check each open panel
      openPanels.forEach((panelName) => {
        const panel = panelRefs.current[panelName]
        const trigger = triggerRefs.current[panelName]

        if (panel && trigger) {
          // Get click coordinates
          const { clientX, clientY } = event

          // Get panel and trigger boundaries
          const panelRect = panel.getBoundingClientRect()
          const triggerRect = trigger.getBoundingClientRect()

          // Check if click is within panel boundaries
          const isWithinPanel =
            clientX >= panelRect.left &&
            clientX <= panelRect.right &&
            clientY >= panelRect.top &&
            clientY <= panelRect.bottom

          // Check if click is within trigger boundaries
          const isWithinTrigger =
            clientX >= triggerRect.left &&
            clientX <= triggerRect.right &&
            clientY >= triggerRect.top &&
            clientY <= triggerRect.bottom

          // Check if it's left or right panel and determine closure based on lock status
          const panelIndex = navPanels.findIndex((panel) => panel.name === panelName)
          const isLeftPanel = panelIndex === 0
          const isRightPanel = panelIndex === navPanels.length - 1

          // Don't close the panel if it's locked
          const isLocked =
            (isLeftPanel && appearanceSettings.leftNavPanelLocked) ||
            (isRightPanel && appearanceSettings.rightNavPanelLocked)

          // Close panel only if click is outside both panel and trigger, and the panel is not locked
          if (!isWithinPanel && !isWithinTrigger && !isLocked) {
            setOpenPanels((prev) => {
              const newSet = new Set(prev)
              newSet.delete(panelName)
              return newSet
            })
          }
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [
    openPanels,
    appearanceSettings.leftNavPanelLocked,
    appearanceSettings.rightNavPanelLocked,
    navPanels,
  ])

  // Toggle panel open/close state
  const toggleItem = (itemName: string) => {
    setOpenPanels((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        // Close this panel
        newSet.delete(itemName)
      } else {
        // Close non-locked panels before opening a new one
        Array.from(prev).forEach((panelName) => {
          const idx = navPanels.findIndex((panel) => panel.name === panelName)
          const isPanelLeft = idx === 0
          const isPanelRight = idx === navPanels.length - 1
          const isPanelLocked =
            (isPanelLeft && appearanceSettings.leftNavPanelLocked) ||
            (isPanelRight && appearanceSettings.rightNavPanelLocked)

          if (!isPanelLocked) {
            newSet.delete(panelName)
          }
        })

        // Open the new panel
        newSet.add(itemName)
      }
      return newSet
    })
  }

  return (
    <header className="bg-sidebar text-white flex flex-col shadow-[0_2px_20px_rgba(0,0,0,0.7)] z-3000">
      <nav className="w-full flex flex-row items-center justify-between px-4 h-[35px] relative">
        {navPanels.map(({ icon, name, panel: Panel }, index) => (
          <Collapsible
            key={name}
            open={openPanels.has(name)}
            onOpenChange={() => toggleItem(name)}
            className="size-8"
          >
            <CollapsibleTrigger asChild>
              <FaButton
                ref={(el) => {
                  triggerRefs.current[name] = el
                }}
                icon={icon}
                isActive={openPanels.has(name)}
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              ref={(el) => {
                panelRefs.current[name] = el
              }}
              className={cn(
                'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
                'bg-background border border-border rounded-lg shadow-lg',
                'absolute top-[35px] left-0 right-0 w-full p-1.5',
                'max-h-[calc(100dvh-calc(35px))] overflow-y-auto',
                (index === 0 || index === navPanels.length - 1) &&
                  'lg:fixed lg:top-0 lg:w-[calc(25%-1px)] h-full',
                index === 0
                  ? 'lg:right-auto'
                  : index === navPanels.length - 1
                    ? 'lg:left-auto'
                    : undefined,
              )}
            >
              <Panel />
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </header>
  )
}
