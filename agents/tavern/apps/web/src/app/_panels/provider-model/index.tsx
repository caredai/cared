import { ModelSelect } from './model-select'

export function ProviderModelPanel() {
  return (
    <div className="min-h-[60dvh] flex flex-col gap-6 p-4">
      <ModelSelect
        label="Model"
        description="The language model for chat completion"
        type="language"
      />
    </div>
  )
}
