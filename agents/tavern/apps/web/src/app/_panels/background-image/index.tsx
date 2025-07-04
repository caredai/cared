'use client'

import { useState } from 'react'
import Image from 'next/image'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'

import { useBackgroundSettings, useUpdateSettingsMutation } from '@/hooks/use-settings'
import { cn } from '@/lib/utils'

export const backgroundFittings = {
  classic: 'bg-cover',
  cover: 'bg-cover bg-center',
  contain: 'bg-contain bg-center',
  stretch: 'bg-size-[100%_100%]',
  center: 'bg-auto bg-center',
}

const BackgroundItem = ({
  url,
  name,
  selected,
  onClick,
}: {
  url: string
  name: string
  selected: boolean
  onClick: () => void
}) => {
  return (
    <div
      className={cn(
        'relative aspect-3/2 rounded-lg overflow-hidden cursor-pointer transition-all',
        'hover:ring-2 hover:ring-ring',
        selected && 'ring-2 ring-ring',
      )}
      onClick={onClick}
    >
      <Image src={url} alt={name} fill className="object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
        {name}
      </div>
    </div>
  )
}

// Background Image Panel Component
export function BackgroundImagePanel() {
  const backgroundSettings = useBackgroundSettings()

  const updateSettings = useUpdateSettingsMutation()

  const [filter, setFilter] = useState('')

  // Filter backgrounds based on search
  const filteredBackgrounds = backgroundSettings.available.filter((bg) =>
    bg.name.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Background Image</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter"
            className="px-3 py-1 rounded border"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          <Select
            value={backgroundSettings.fitting}
            onValueChange={async (value) => {
              await updateSettings({
                background: {
                  ...backgroundSettings,
                  fitting: value as keyof typeof backgroundFittings,
                },
              })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-5000">
              <SelectGroup>
                {Object.keys(backgroundFittings).map((fitting) => (
                  <SelectItem key={fitting} value={fitting}>
                    {fitting.charAt(0).toUpperCase() + fitting.slice(1)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <button className="px-3 py-1 rounded border">Auto-select</button>
        </div>
      </div>

      {/* System Backgrounds */}
      <div className="@container">
        <h3 className="text-md font-medium mb-2">System Backgrounds</h3>
        <div className="grid grid-cols-2 @xs:grid-cols-3 @3xl:grid-cols-4 gap-6">
          {filteredBackgrounds.map((bg) => (
            <BackgroundItem
              key={bg.name}
              url={bg.url}
              name={bg.name}
              selected={backgroundSettings.active.url === bg.url}
              onClick={async () => {
                await updateSettings({
                  background: {
                    ...backgroundSettings,
                    active: bg,
                  },
                })
              }}
            />
          ))}
        </div>
      </div>

      {/* Chat Backgrounds */}
      <div>
        <h3 className="text-md font-medium mb-2">Chat Backgrounds</h3>
        <div className="text-center text-gray-500 py-4">
          Chat backgrounds generated with the Image Generation extension will appear here.
        </div>
      </div>
    </div>
  )
}
