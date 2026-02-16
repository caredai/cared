import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@cared/ui/components/toggle-group'

import { SectionTitle } from '@/components/section'
import { ModelsList } from './models-list'
import { ProvidersModelsGrid } from './providers-models-grid'

type ViewMode = 'provider' | 'list'

export function Models({ scope }: { scope: 'system' | 'effective' }) {
  const [viewMode, setViewMode] = useState<ViewMode>('provider')

  return (
    <>
      <div className="flex flex-col gap-4">
        <SectionTitle title="Models" description="View and manage available models" />

        <div className="flex justify-end">
          <ToggleGroup
            type="single"
            variant="outline"
            value={viewMode}
            onValueChange={(value) => {
              if (value) {
                setViewMode(value as ViewMode)
              }
            }}
          >
            <ToggleGroupItem value="provider" aria-label="Group by provider">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List all models">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="h-[calc(100dvh-57px-48px-108px-32px)]">
        {viewMode === 'provider' ? (
          <ProvidersModelsGrid scope={scope} />
        ) : (
          <ModelsList scope={scope} />
        )}
      </div>
    </>
  )
}
