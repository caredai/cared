import { useState } from 'react'
import classNames from 'classnames'

// Mock extensions data
const mockExtensions = [
  {
    id: '1',
    name: 'Image Generation',
    description: 'Generate images from text descriptions',
    enabled: true,
    version: '1.0.0',
  },
  {
    id: '2',
    name: 'Voice Chat',
    description: 'Enable voice interactions with AI',
    enabled: false,
    version: '0.9.0',
  },
  // Add more extensions as needed
]

interface ExtensionCardProps {
  id: string
  name: string
  description: string
  enabled: boolean
  version: string
  onToggle: () => void
}

// Extension card component
const ExtensionCard = ({ name, description, enabled, version, onToggle }: ExtensionCardProps) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">v{version}</span>
          <button
            className={classNames(
              'px-3 py-1 rounded text-sm',
              enabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700',
            )}
            onClick={onToggle}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

// Extensions Panel Component
export function ExtensionsPanel() {
  const [extensions, setExtensions] = useState(mockExtensions)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter extensions based on search
  const filteredExtensions = extensions.filter(
    (ext) =>
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Toggle extension enabled state
  const toggleExtension = (id: string) => {
    setExtensions((exts) =>
      exts.map((ext) => (ext.id === id ? { ...ext, enabled: !ext.enabled } : ext)),
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Extensions</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search extensions..."
            className="px-3 py-1 rounded border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="px-3 py-1 rounded bg-green-500 text-white">Install New</button>
        </div>
      </div>

      {/* Extensions List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredExtensions.map((ext) => (
          <ExtensionCard key={ext.id} {...ext} onToggle={() => toggleExtension(ext.id)} />
        ))}
      </div>

      {/* Empty State */}
      {filteredExtensions.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No extensions found. Install some to enhance your experience.
        </div>
      )}
    </div>
  )
}
