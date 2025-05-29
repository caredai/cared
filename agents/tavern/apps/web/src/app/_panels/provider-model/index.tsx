import { ModelSelect } from './model-select'

export function ProviderModelPanel() {
  return (
    <div className="flex flex-col gap-6">
      <ModelSelect
        label="Model"
        description="The language model for chat completion"
        type="language"
      />
    </div>
  )
}
