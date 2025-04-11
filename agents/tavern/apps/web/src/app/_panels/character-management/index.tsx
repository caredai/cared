import { useState } from 'react'
import classNames from 'classnames'

// Mock character data
const mockCharacters = [
  { id: '1', name: 'Alice', description: 'A friendly AI assistant' },
  { id: '2', name: 'Bob', description: 'A knowledgeable teacher' },
  // Add more characters as needed
]

interface CharacterCardProps {
  id: string
  name: string
  description: string
  selected: boolean
  onClick: () => void
}

// Character card component
const CharacterCard = ({ name, description, selected, onClick }: CharacterCardProps) => {
  return (
    <div
      className={classNames(
        'p-4 border rounded-lg cursor-pointer transition-all',
        'hover:border-blue-500',
        selected && 'border-blue-500 bg-blue-50',
      )}
      onClick={onClick}
    >
      <h3 className="font-medium">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

// Character Management Panel Component
export function CharacterManagementPanel() {
  const [selectedCharacter, setSelectedCharacter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter characters based on search
  const filteredCharacters = mockCharacters.filter(
    (char) =>
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Character Management</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search characters..."
            className="px-3 py-1 rounded border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="px-3 py-1 rounded bg-blue-500 text-white">Create New</button>
        </div>
      </div>

      {/* Character List */}
      <div className="grid grid-cols-2 gap-4">
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            {...char}
            selected={selectedCharacter === char.id}
            onClick={() => setSelectedCharacter(char.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredCharacters.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No characters found. Create a new one to get started.
        </div>
      )}
    </div>
  )
}
