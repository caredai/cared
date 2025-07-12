'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  faAddressCard,
  faBookAtlas,
  faCubes,
  faFaceSmile,
  faPanorama,
  faPlug,
  // faPlugCircleExclamation,
  faSliders,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons'

import { Collapsible, CollapsibleTrigger } from '@ownxai/ui/components/collapsible'
import { CollapsibleContent } from '@ownxai/ui/components/collapsible-content'
import { cn } from '@ownxai/ui/lib/utils'

import { FaButton } from '@/components/fa-button'
import { useAppearanceSettings, useUpdateSettingsMutation } from '@/hooks/use-settings'
import { BackgroundImagePanel } from '../_panels/background-image'
import { CharacterManagementPanel } from '../_panels/character-management'
import { ExtensionsPanel } from '../_panels/extensions'
import { LorebookPanel } from '../_panels/lorebook'
import { ModelConfigurationPanel } from '../_panels/model-configuration'
import { PersonaManagementPanel } from '../_panels/persona-management'
import { ProviderModelPanel } from '../_panels/provider-model'
import { UserSettingsPanel } from '../_panels/user-settings'

// Define navigation panel configuration
const navPanels = [
  { icon: faSliders, name: 'response-configuration', panel: ModelConfigurationPanel },
  { icon: faPlug, name: 'provider-model', panel: ProviderModelPanel },
  { icon: faBookAtlas, name: 'lorebook', panel: LorebookPanel },
  { icon: faUserCog, name: 'user-settings', panel: UserSettingsPanel },
  { icon: faPanorama, name: 'background-image', panel: BackgroundImagePanel },
  { icon: faCubes, name: 'extensions', panel: ExtensionsPanel },
  { icon: faFaceSmile, name: 'persona-management', panel: PersonaManagementPanel },
  { icon: faAddressCard, name: 'character-management', panel: CharacterManagementPanel },
] as const

export function Navbar() {
  const appearanceSettings = useAppearanceSettings()
  const updateSettings = useUpdateSettingsMutation()

  // Use Set to track multiple open panels instead of a single openItem
  const [openPanels, _setOpenPanels] = useState<Set<string>>(new Set())

  // Create refs object to store all panel refs
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Wrapped version of setOpenPanels that also updates appearance settings
  const setOpenPanels = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      _setOpenPanels((prev) => {
        const newSet = updater(prev)

        // Update appearance settings
        const leftPanelName = navPanels[0].name
        const rightPanelName = navPanels.at(-1)!.name
        const lorebookPanelName = navPanels.find((panel) => panel.name === 'lorebook')!.name

        void updateSettings({
          appearance: {
            ...appearanceSettings,
            modelPresetPanelOpen: newSet.has(leftPanelName),
            characterPanelOpen: newSet.has(rightPanelName),
            lorebookPanelOpen: newSet.has(lorebookPanelName),
          },
        })

        return newSet
      })
    },
    [appearanceSettings, updateSettings],
  )

  // Initialize panels - automatically open locked panels when component mounts
  useEffect(() => {
    const leftPanelName = navPanels[0].name
    const rightPanelName = navPanels.at(-1)!.name
    const lorebookPanelName = navPanels.find((panel) => panel.name === 'lorebook')!.name

    _setOpenPanels((prev) => {
      const newSet = new Set(prev)

      // Open left panel if locked
      if (appearanceSettings.modelPresetPanelOpen) {
        newSet.add(leftPanelName)
      }

      // Open right panel if locked
      if (appearanceSettings.characterPanelOpen) {
        newSet.add(rightPanelName)
      }

      // Open lorebook panel if locked
      if (appearanceSettings.lorebookPanelOpen) {
        newSet.add(lorebookPanelName)
      }

      return newSet
    })
  }, [
    appearanceSettings.modelPresetPanelOpen,
    appearanceSettings.characterPanelOpen,
    appearanceSettings.lorebookPanelOpen,
  ])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Skip if no panels are open
      if (openPanels.size === 0) return

      // Check if click is within any dialog or popper
      const target = event.target as HTMLElement
      const isWithinDialog =
        target.closest('[role="dialog"]') !== null ||
        target.closest('[data-radix-popper-content-wrapper]') !== null
      if (isWithinDialog) return

      // Check if click is within any panel (not just the open ones)
      const { clientX, clientY } = event

      // Check all panel refs to see if click is within any panel
      let isWithinAnyPanel = false
      for (const panel of Object.values(panelRefs.current)) {
        if (panel) {
          const panelRect = panel.getBoundingClientRect()
          const isWithinPanel =
            clientX >= panelRect.left &&
            clientX <= panelRect.right &&
            clientY >= panelRect.top &&
            clientY <= panelRect.bottom

          if (isWithinPanel) {
            isWithinAnyPanel = true
          }
        }
      }

      // Check if click is within any trigger button
      let isWithinAnyTrigger = false
      for (const trigger of Object.values(triggerRefs.current)) {
        if (trigger) {
          const triggerRect = trigger.getBoundingClientRect()
          const isWithinTrigger =
            clientX >= triggerRect.left &&
            clientX <= triggerRect.right &&
            clientY >= triggerRect.top &&
            clientY <= triggerRect.bottom

          if (isWithinTrigger) {
            isWithinAnyTrigger = true
          }
        }
      }

      // If click is within any panel or trigger, don't close any panels
      if (isWithinAnyPanel || isWithinAnyTrigger) return

      // Check each open panel
      openPanels.forEach((panelName) => {
        // Check if it's left or right panel and determine closure based on lock status
        const panelIndex = navPanels.findIndex((panel) => panel.name === panelName)
        const isLeftPanel = panelIndex === 0
        const isRightPanel = panelIndex === navPanels.length - 1
        const isLorebookPanel = panelName === 'lorebook'

        // Don't close the panel if it's locked
        const isLocked =
          (isLeftPanel && appearanceSettings.modelPresetPanelLocked) ||
          (isRightPanel && appearanceSettings.characterPanelLocked) ||
          (isLorebookPanel && appearanceSettings.lorebookPanelLocked)

        // Close panel only if it's not locked
        if (!isLocked) {
          setOpenPanels((prev) => {
            const newSet = new Set(prev)
            newSet.delete(panelName)
            return newSet
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openPanels, appearanceSettings, setOpenPanels])

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
          const isPanelLorebook = panelName === 'lorebook'
          const isPanelLocked =
            (isPanelLeft && appearanceSettings.modelPresetPanelLocked) ||
            (isPanelRight && appearanceSettings.characterPanelLocked) ||
            (isPanelLorebook && appearanceSettings.lorebookPanelLocked)

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
                'absolute top-[35px] left-0 right-0 w-full',
                (index === 0 || index === navPanels.length - 1) &&
                  'lg:fixed lg:top-0 lg:w-[calc(25%-1px)]',
                index === 0
                  ? 'lg:right-auto'
                  : index === navPanels.length - 1
                    ? 'lg:left-auto'
                    : undefined,
              )}
            >
              <div
                className={cn(
                  'bg-background border border-border rounded-lg shadow-lg',
                  'overflow-y-auto scrollbar-stable',
                  index > 0 &&
                    index < navPanels.length - 1 &&
                    'max-h-[calc(100dvh-calc(70px))] px-2 py-1.5',
                  (index === 0 || index === navPanels.length - 1) && 'h-[calc(100dvh-calc(35px))]',
                )}
              >
                <Panel />
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </header>
  )
}
