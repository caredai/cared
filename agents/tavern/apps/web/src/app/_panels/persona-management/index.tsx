import { useState } from 'react'
import classNames from 'classnames'

// Mock persona data
const mockPersonas = [
  { id: '1', name: 'Professional', traits: ['Formal', 'Knowledgeable', 'Precise'] },
  { id: '2', name: 'Friendly', traits: ['Casual', 'Warm', 'Supportive'] },
  // Add more personas as needed
]

interface PersonaCardProps {
  id: string
  name: string
  traits: string[]
  selected: boolean
  onClick: () => void
}

// Persona card component
const PersonaCard = ({ name, traits, selected, onClick }: PersonaCardProps) => {
  return (
    <div
      className={classNames(
        'p-4 border rounded-lg cursor-pointer transition-all',
        'hover:border-purple-500',
        selected && 'border-purple-500 bg-purple-50',
      )}
      onClick={onClick}
    >
      <h3 className="font-medium">{name}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {traits.map((trait, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
            {trait}
          </span>
        ))}
      </div>
    </div>
  )
}

// Persona Management Panel Component
export function PersonaManagementPanel() {
  const [selectedPersona, setSelectedPersona] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter personas based on search
  const filteredPersonas = mockPersonas.filter(
    (persona) =>
      persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.traits.some((trait) => trait.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Persona Management</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search personas..."
            className="px-3 py-1 rounded border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="px-3 py-1 rounded bg-purple-500 text-white">Create New</button>
        </div>
      </div>

      {/* Persona List */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPersonas.map((persona) => (
          <PersonaCard
            key={persona.id}
            {...persona}
            selected={selectedPersona === persona.id}
            onClick={() => setSelectedPersona(persona.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredPersonas.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No personas found. Create a new one to get started.
        </div>
      )}
    </div>
  )
}
