'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import type { UpdateModelArgs } from '@cared/api'
import type { ModelFullId, ModelType, ProviderId } from '@cared/providers'
import { updateModelArgsSchema } from '@cared/api/types'
import { modelFullId, splitModelFullId } from '@cared/providers'
import { Button } from '@cared/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Switch } from '@cared/ui/components/switch'

import { Input } from '@/components/input'
import { OptionalNumberInput } from '@/components/number-input'
import { OptionalPriceInput } from '@/components/price-input'
import { CircleSpinner } from '@/components/spinner'

export type EditableModel = {
  id: ModelFullId
  isEditing: boolean
  isNew?: boolean
} & UpdateModelArgs

// Helper function to get default values for a model type
export function getDefaultValuesForModelType(
  providerId: ProviderId,
  type: ModelType,
): UpdateModelArgs {
  const baseDefaults = {
    id: `${providerId}:` as ModelFullId,
    name: '',
    description: '',
    deprecated: false,
    retired: false,
  }

  switch (type) {
    case 'language':
      return {
        type,
        model: {
          ...baseDefaults,
          contextWindow: undefined,
          maxOutputTokens: undefined,
          inputTokenPrice: undefined,
          cachedInputTokenPrice: undefined,
          cacheInputTokenPrice: undefined,
          outputTokenPrice: undefined,
        },
      }
    case 'image':
      return {
        type,
        model: {
          ...baseDefaults,
          imageInputTokenPrice: undefined,
          imageCachedInputTokenPrice: undefined,
          imageOutputTokenPrice: undefined,
          textInputTokenPrice: undefined,
          textCachedInputTokenPrice: undefined,
          pricePerImage: undefined,
        },
      }
    case 'speech':
      return {
        type,
        model: {
          ...baseDefaults,
          maxInputTokens: undefined,
          textTokenPrice: undefined,
          audioTokenPrice: undefined,
        },
      }
    case 'transcription':
      return {
        type,
        model: {
          ...baseDefaults,
          audioTokenPrice: undefined,
          textInputTokenPrice: undefined,
          textOutputTokenPrice: undefined,
        },
      }
    case 'textEmbedding':
      return {
        type,
        model: {
          ...baseDefaults,
          tokenPrice: undefined,
          dimensions: undefined,
        },
      }
  }
}

export function ModelItemEdit({
  index,
  providerId,
  model,
  isSaving,
  isRemoving,
  onCancel,
  onSave,
  onRemove,
}: {
  index: number
  providerId: ProviderId
  model: EditableModel
  isSaving: boolean
  isRemoving: boolean
  onCancel: () => void
  onSave: (formData: UpdateModelArgs) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const form = useForm<UpdateModelArgs>({
    resolver: zodResolver(updateModelArgsSchema),
    defaultValues: {
      type: model.type,
      model: model.model,
    },
  })

  const handleSave = async () => {
    if (await form.trigger()) {
      const formData = form.getValues()
      await onSave(formData)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  // Disable form inputs only when saving or removing
  const isFormDisabled = isSaving || isRemoving

  return (
    <div className="border rounded-lg p-4 my-2 bg-muted/50">
      <Form {...form}>
        <form className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {model.isNew ? 'New Model' : 'Edit Model'} #{index + 1}
            </h4>
            <div className="flex items-center gap-2">
              {!model.isNew && (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-6"
                  onClick={handleCancel}
                  disabled={isFormDisabled}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
              <Button
                size="icon"
                className="size-6"
                onClick={(e) => {
                  e.preventDefault()
                  void handleSave()
                }}
                disabled={isFormDisabled}
              >
                {isSaving ? <CircleSpinner className="size-3" /> : <CheckIcon className="size-3" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-6"
                onClick={onRemove}
                disabled={isFormDisabled}
              >
                {isRemoving ? (
                  <CircleSpinner className="size-3" />
                ) : (
                  <Trash2Icon className="size-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Common fields for all model types */}

          <FormField
            control={form.control}
            name="model.id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter model ID (e.g., gpt-4, claude-3-sonnet)"
                    {...field}
                    value={splitModelFullId(field.value).modelId}
                    onChange={(modelId) => field.onChange(modelFullId(providerId, modelId))}
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter model name" {...field} disabled={isFormDisabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter model description"
                    {...field}
                    disabled={isFormDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="model.deprecated"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel>Deprecated</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model.retired"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormLabel>Retired</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Render model-specific edit form based on type */}
          {model.type === 'language' && (
            <LanguageModelItemEdit form={form} isFormDisabled={isFormDisabled} />
          )}
          {model.type === 'image' && (
            <ImageModelItemEdit form={form} isFormDisabled={isFormDisabled} />
          )}
          {model.type === 'speech' && (
            <SpeechModelItemEdit form={form} isFormDisabled={isFormDisabled} />
          )}
          {model.type === 'transcription' && (
            <TranscriptionModelItemEdit form={form} isFormDisabled={isFormDisabled} />
          )}
          {model.type === 'textEmbedding' && (
            <EmbeddingModelItemEdit form={form} isFormDisabled={isFormDisabled} />
          )}
        </form>
      </Form>
    </div>
  )
}

// Language Model Item Edit
function LanguageModelItemEdit({ form, isFormDisabled }: { form: any; isFormDisabled: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="model.contextWindow"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Context Length (Optional)</FormLabel>
            <FormControl>
              <OptionalNumberInput
                placeholder="Enter context window size"
                value={field.value}
                onChange={field.onChange}
                min={1}
                step={1}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.maxOutputTokens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Output Length (Optional)</FormLabel>
            <FormControl>
              <OptionalNumberInput
                placeholder="Enter max output tokens"
                value={field.value}
                onChange={field.onChange}
                min={1}
                step={1}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.inputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Input Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter input token price (e.g., 0.015)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.cachedInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cache Read Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter cached input token price (e.g., 0.0003)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.cacheInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cache Write Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter cache input token price (e.g., 0.003)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.outputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Output Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter output token price (e.g., 0.06)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Image Model Item Edit
function ImageModelItemEdit({ form, isFormDisabled }: { form: any; isFormDisabled: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="model.imageInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image Input Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter image input token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.imageCachedInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image Cache Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter image cached input token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.imageOutputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image Output Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter image output token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.textInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Input Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter text input token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.textCachedInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Cache Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter text cached input token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.pricePerImage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price $ Per Image (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter price per image (e.g., 0.04)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Speech Model Item Edit
function SpeechModelItemEdit({ form, isFormDisabled }: { form: any; isFormDisabled: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="model.maxInputTokens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Input Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalNumberInput
                placeholder="Enter max input tokens"
                value={field.value}
                onChange={field.onChange}
                min={1}
                step={1}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.textTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter text token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.audioTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Audio Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter audio token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Transcription Model Item Edit
function TranscriptionModelItemEdit({
  form,
  isFormDisabled,
}: {
  form: any
  isFormDisabled: boolean
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="model.audioTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Audio Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter audio token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.textInputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Input Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter text input token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.textOutputTokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Output Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter text output token price"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

// Embedding Model Item Edit
function EmbeddingModelItemEdit({ form, isFormDisabled }: { form: any; isFormDisabled: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="model.dimensions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dimensions (Optional)</FormLabel>
            <FormControl>
              <OptionalNumberInput
                placeholder="Enter dimensions (e.g., 1536)"
                value={field.value}
                onChange={field.onChange}
                min={1}
                step={1}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="model.tokenPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price $/M Tokens (Optional)</FormLabel>
            <FormControl>
              <OptionalPriceInput
                placeholder="Enter token price (e.g., 0.01)"
                {...field}
                disabled={isFormDisabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
