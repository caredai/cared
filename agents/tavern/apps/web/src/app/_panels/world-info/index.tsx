import { useState } from 'react'
import classNames from 'classnames'

// Mock world info data
const mockWorldInfo = [
  {
    id: '1',
    name: 'Fantasy Kingdom',
    description: 'A medieval fantasy world with magic and mythical creatures',
    entries: [
      { id: '1-1', title: 'Magic System', content: 'Based on elemental forces...' },
      { id: '1-2', title: 'Royal Family', content: 'The current ruling dynasty...' },
    ],
  },
  {
    id: '2',
    name: 'Sci-Fi Universe',
    description: 'A futuristic space-faring civilization',
    entries: [
      { id: '2-1', title: 'Technology', content: 'Advanced AI and quantum computing...' },
      { id: '2-2', title: 'Alien Races', content: 'Various sentient species...' },
    ],
  },
]

interface WorldEntryProps {
  title: string
  content: string
  onEdit: () => void
  onDelete: () => void
}

// World entry component
const WorldEntry = ({ title, content, onEdit, onDelete }: WorldEntryProps) => {
  return (
    <div className="border-b last:border-b-0 py-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-blue-500 text-sm hover:underline">
            Edit
          </button>
          <button onClick={onDelete} className="text-red-500 text-sm hover:underline">
            Delete
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  )
}

interface WorldCardProps {
  id: string
  name: string
  description: string
  entries: { id: string; title: string; content: string }[]
  selected: boolean
  onClick: () => void
}

// World card component
const WorldCard = ({ name, description, entries, selected, onClick }: WorldCardProps) => {
  return (
    <div
      className={classNames(
        'p-4 border rounded-lg cursor-pointer transition-all',
        'hover:border-indigo-500',
        selected && 'border-indigo-500 bg-indigo-50',
      )}
      onClick={onClick}
    >
      <h3 className="font-medium mb-1">{name}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="text-xs text-gray-500">{entries.length} entries</div>
    </div>
  )
}

// World Info Panel Component
export function WorldInfoPanel() {
  const [worlds, _setWorlds] = useState(mockWorldInfo)
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter worlds based on search
  const filteredWorlds = worlds.filter(
    (world) =>
      world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      world.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get selected world data
  const selectedWorldData = worlds.find((w) => w.id === selectedWorld)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold mb-4">World Information</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search worlds..."
            className="px-3 py-1 rounded border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="px-3 py-1 rounded bg-indigo-500 text-white">Create World</button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Worlds List */}
        <div className="w-1/2">
          <div className="grid grid-cols-1 gap-4">
            {filteredWorlds.map((world) => (
              <WorldCard
                key={world.id}
                {...world}
                selected={selectedWorld === world.id}
                onClick={() => setSelectedWorld(world.id)}
              />
            ))}
          </div>

          {filteredWorlds.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No worlds found. Create a new one to get started.
            </div>
          )}
        </div>

        {/* World Details */}
        <div className="w-1/2 border rounded-lg p-4">
          {selectedWorldData ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{selectedWorldData.name}</h3>
                <button className="px-3 py-1 rounded bg-indigo-500 text-white text-sm">
                  Add Entry
                </button>
              </div>
              <div className="space-y-2">
                {selectedWorldData.entries.map((entry) => (
                  <WorldEntry
                    key={entry.id}
                    {...entry}
                    onEdit={() => console.log('Edit entry:', entry.id)}
                    onDelete={() => console.log('Delete entry:', entry.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a world to view and edit its entries
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
