import { useState } from 'react'
import classNames from 'classnames'

// Mock formatting presets
const mockPresets = [
  {
    id: '1',
    name: 'Default',
    description: 'Standard response formatting',
    settings: {
      maxLength: 2000,
      temperature: 0.7,
      format: 'markdown',
    },
  },
  {
    id: '2',
    name: 'Concise',
    description: 'Short and direct responses',
    settings: {
      maxLength: 500,
      temperature: 0.5,
      format: 'text',
    },
  },
]

interface FormatSettingsProps {
  settings: {
    maxLength: number
    temperature: number
    format: string
  }
  onChange: (key: string, value: any) => void
}

// Format settings component
const FormatSettings = ({ settings, onChange }: FormatSettingsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Maximum Length</label>
        <input
          type="number"
          value={settings.maxLength}
          onChange={(e) => onChange('maxLength', parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          min="1"
          max="10000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Temperature</label>
        <input
          type="range"
          value={settings.temperature}
          onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
          className="w-full"
          min="0"
          max="1"
          step="0.1"
        />
        <div className="text-sm text-gray-500 mt-1">
          {settings.temperature} (Lower = more focused, Higher = more creative)
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Output Format</label>
        <select
          value={settings.format}
          onChange={(e) => onChange('format', e.target.value)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="text">Plain Text</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>
    </div>
  )
}

interface PresetCardProps {
  id: string
  name: string
  description: string
  selected: boolean
  onClick: () => void
}

// Preset card component
const PresetCard = ({ name, description, selected, onClick }: PresetCardProps) => {
  return (
    <div
      className={classNames(
        'p-4 border rounded-lg cursor-pointer transition-all',
        'hover:border-teal-500',
        selected && 'border-teal-500 bg-teal-50',
      )}
      onClick={onClick}
    >
      <h3 className="font-medium">{name}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  )
}

// Response Formatting Panel Component
export function ResponseFormattingPanel() {
  const [presets] = useState(mockPresets)
  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0].id)
  const [currentSettings, setCurrentSettings] = useState(presets[0].settings)

  // Get current preset
  const currentPreset = presets.find((p) => p.id === selectedPreset)

  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    setCurrentSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-4">Response Formatting</h2>
        <p className="text-sm text-gray-500">Configure how AI responses are formatted</p>
      </div>

      {/* Presets */}
      <div>
        <h3 className="text-md font-medium mb-3">Formatting Presets</h3>
        <div className="grid grid-cols-2 gap-4">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              {...preset}
              selected={selectedPreset === preset.id}
              onClick={() => {
                setSelectedPreset(preset.id)
                setCurrentSettings(preset.settings)
              }}
            />
          ))}
        </div>
      </div>

      {/* Settings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-medium">Current Settings</h3>
          <button
            className="text-sm text-teal-500 hover:underline"
            onClick={() => {
              if (currentPreset) {
                setCurrentSettings(currentPreset.settings)
              }
            }}
          >
            Reset to Preset
          </button>
        </div>
        <FormatSettings settings={currentSettings} onChange={handleSettingChange} />
      </div>
    </div>
  )
}
