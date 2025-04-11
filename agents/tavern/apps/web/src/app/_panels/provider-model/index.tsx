import { useState } from 'react'
import classNames from 'classnames'

// Mock providers and models data
const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-based language models',
    models: [
      { id: 'gpt-4', name: 'GPT-4', context: 8192, cost: 'High' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context: 4096, cost: 'Medium' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude language models',
    models: [
      { id: 'claude-2', name: 'Claude 2', context: 100000, cost: 'High' },
      { id: 'claude-instant', name: 'Claude Instant', context: 100000, cost: 'Low' },
    ],
  },
]

interface ProviderCardProps {
  id: string
  name: string
  description: string
  selected: boolean
  onClick: () => void
}

// Provider card component
const ProviderCard = ({ name, description, selected, onClick }: ProviderCardProps) => {
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
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  )
}

interface ModelCardProps {
  id: string
  name: string
  context: number
  cost: string
  selected: boolean
  onClick: () => void
}

// Model card component
const ModelCard = ({ name, context, cost, selected, onClick }: ModelCardProps) => {
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
      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
        <div>Context: {context.toLocaleString()} tokens</div>
        <div>Cost: {cost}</div>
      </div>
    </div>
  )
}

// Provider Model Panel Component
export function ProviderModelPanel() {
  const [providers] = useState(mockProviders)
  const defaultProvider = providers[0]
  const defaultModel = defaultProvider.models[0]

  const [selectedProvider, setSelectedProvider] = useState<string>(defaultProvider.id)
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel.id)

  // Get current provider
  const currentProvider = providers.find((p) => p.id === selectedProvider) ?? defaultProvider

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-4">Provider Model</h2>
        <p className="text-sm text-gray-500">Select AI provider and model</p>
      </div>

      {/* Providers */}
      <div>
        <h3 className="text-md font-medium mb-3">AI Providers</h3>
        <div className="grid grid-cols-2 gap-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              {...provider}
              selected={selectedProvider === provider.id}
              onClick={() => {
                setSelectedProvider(provider.id)
                // Select first model of new provider
                if (provider.models.length > 0) {
                  setSelectedModel(provider.models[0].id)
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Models */}
      <div>
        <h3 className="text-md font-medium mb-3">Available Models</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentProvider.models.map((model) => (
            <ModelCard
              key={model.id}
              {...model}
              selected={selectedModel === model.id}
              onClick={() => setSelectedModel(model.id)}
            />
          ))}
        </div>
      </div>

      {/* API Key */}
      <div>
        <h3 className="text-md font-medium mb-3">API Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              placeholder="Enter your API key"
              className="w-full px-3 py-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key will be securely stored and encrypted
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
