'use client'

import type { Item } from '@/components/virtualized-select-content'
import type { UseControllerProps } from 'react-hook-form'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { BotIcon, PlusIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@mindworld/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mindworld/ui/components/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@mindworld/ui/components/form'
import { Input } from '@mindworld/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mindworld/ui/components/select'
import { Textarea } from '@mindworld/ui/components/textarea'

import { VirtualizedSelectContent } from '@/components/virtualized-select-content'
import { useTRPC } from '@/trpc/client'

// Form schema for creating a new app
const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: z.enum(['single-agent', 'multiple-agents']),
  languageModel: z.string().min(1, 'Language model is required'),
  embeddingModel: z.string().min(1, 'Embedding model is required'),
  imageModel: z.string().min(1, 'Image model is required'),
})

type CreateAppFormValues = z.infer<typeof createAppSchema>

interface ModelSelectProps {
  name: keyof Pick<CreateAppFormValues, 'languageModel' | 'embeddingModel' | 'imageModel'>
  label: string
  description: string
  items: Item[]
  control: UseControllerProps<CreateAppFormValues>['control']
}

function ModelSelect({ name, label, description, items, control }: ModelSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            open={open}
            onOpenChange={setOpen}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
            </FormControl>
            {(field.value || items.length > 0) && (
              <VirtualizedSelectContent items={items} value={field.value} open={open} />
            )}
          </Select>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface CreateAppDialogProps {
  workspaceId: string
}

export function CreateAppDialog({ workspaceId }: CreateAppDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Get models data for selection
  const { data: modelsData } = useSuspenseQuery(trpc.model.listProvidersModels.queryOptions())

  // Get default models data
  const { data: defaultModelsData } = useSuspenseQuery(trpc.model.listDefaultModels.queryOptions())

  // Process model data with memoization to improve performance
  const { languageModelItems, embeddingModelItems, imageModelItems } = useMemo(() => {
    // Process language models data by provider
    const languageModelItems: Item[] = modelsData.models.language
      ? modelsData.models.language.flatMap((provider) => [
          // Add provider as a group label (no value)
          { label: provider.name },
          // Add all models from this provider with their original names
          ...provider.models.map((model) => ({
            label: model.name,
            value: model.id,
          })),
        ])
      : []

    // Process embedding models data by provider
    const embeddingModelItems: Item[] = modelsData.models['text-embedding']
      ? modelsData.models['text-embedding'].flatMap((provider) => [
          // Add provider as a group label (no value)
          { label: provider.name },
          // Add all models from this provider with their original names
          ...provider.models.map((model) => ({
            label: model.name,
            value: model.id,
          })),
        ])
      : []

    // Process image models data by provider
    const imageModelItems: Item[] = modelsData.models.image
      ? modelsData.models.image.flatMap((provider) => [
          // Add provider as a group label (no value)
          { label: provider.name },
          // Add all models from this provider with their original names
          ...provider.models.map((model) => ({
            label: model.name,
            value: model.id,
          })),
        ])
      : []

    return {
      languageModelItems,
      embeddingModelItems,
      imageModelItems,
    }
  }, [modelsData.models])

  // Compute default model values with memoization
  const defaultValues = useMemo(() => {
    // Get first available model as fallback
    const firstLanguageModel = languageModelItems.find((item) => item.value)?.value || ''
    const firstEmbeddingModel = embeddingModelItems.find((item) => item.value)?.value || ''
    const firstImageModel = imageModelItems.find((item) => item.value)?.value || ''

    // Use default models from API if available, otherwise use first available model
    return {
      name: '',
      description: '',
      type: 'single-agent' as const,
      languageModel: defaultModelsData.defaultModels.app.languageModel || firstLanguageModel,
      embeddingModel: defaultModelsData.defaultModels.app.embeddingModel || firstEmbeddingModel,
      imageModel: defaultModelsData.defaultModels.app.imageModel || firstImageModel,
    }
  }, [
    defaultModelsData.defaultModels.app,
    languageModelItems,
    embeddingModelItems,
    imageModelItems,
  ])

  // Set up form with validation
  const form = useForm<CreateAppFormValues>({
    resolver: zodResolver(createAppSchema),
    defaultValues,
  })

  // Create app mutation
  const createAppMutation = useMutation(
    trpc.app.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`App "${data.app.name}" created successfully`)
        setOpen(false)
        void queryClient.invalidateQueries(
          trpc.app.list.queryOptions({
            workspaceId,
            limit: 100,
          }),
        )
        // Navigate to the new app page
        router.push(`/${workspaceId}/apps/${data.app.id}`)
      },
      onError: (error) => {
        console.error('Failed to create app:', error)
        toast.error(`Failed to create app: ${error.message}`)
      },
    }),
  )

  // Handle form submission
  async function onSubmit(values: CreateAppFormValues) {
    // Trim name and description and update form values
    const trimmedName = values.name.trim()
    const trimmedDescription = values.description?.trim() ?? ''

    // Update form with trimmed values
    form.setValue('name', trimmedName)
    form.setValue('description', trimmedDescription)

    // Validate form after updating values
    return await form.trigger().then((isValid) => {
      if (!isValid) return

      // Continue with form submission if valid
      // Create metadata object, only including models that differ from defaults
      const metadata: Record<string, any> = {
        description: trimmedDescription,
      }

      // Only add models to metadata when they differ from default models
      if (values.languageModel !== defaultModelsData.defaultModels.app.languageModel) {
        metadata.languageModel = values.languageModel
      }

      if (values.embeddingModel !== defaultModelsData.defaultModels.app.embeddingModel) {
        metadata.embeddingModel = values.embeddingModel
      }

      if (values.imageModel !== defaultModelsData.defaultModels.app.imageModel) {
        metadata.imageModel = values.imageModel
      }

      createAppMutation.mutate({
        workspaceId,
        name: trimmedName,
        metadata,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          New App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New App</DialogTitle>
          <DialogDescription>
            Create a new AI agent application. Configure basic settings here and add more details
            later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <div className="overflow-y-auto pr-1 flex-1">
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-12 mx-2">
                {/* Left column - Basic Information */}
                <div className="space-y-4">
                  <div className="mb-2 text-sm font-medium">Basic Information</div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My AI App" {...field} />
                        </FormControl>
                        <FormDescription>The name of your application</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A brief description of what your app does..."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain the purpose and functionality of your app
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select app type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single-agent">
                              <div className="flex items-center">
                                <BotIcon className="h-4 w-4 mr-2" />
                                <span>Single Agent</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="multiple-agents">
                              <div className="flex items-center">
                                <div className="relative mr-2">
                                  <BotIcon className="h-4 w-4" />
                                  <BotIcon
                                    className="h-4 w-4 absolute -top-1 -right-1 text-muted-foreground"
                                    style={{ transform: 'scale(0.7)' }}
                                  />
                                </div>
                                <span>Multiple Agents</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose whether your app will use a single agent or multiple agents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right column - Model Selection */}
                <div className="space-y-4">
                  <div className="mb-2 text-sm font-medium">Model Selection</div>

                  <ModelSelect
                    name="languageModel"
                    label="Language Model"
                    description="The language model for text generation"
                    items={languageModelItems}
                    control={form.control}
                  />

                  <ModelSelect
                    name="embeddingModel"
                    label="Embedding Model"
                    description="Used for embedding memories and knowledge"
                    items={embeddingModelItems}
                    control={form.control}
                  />

                  <ModelSelect
                    name="imageModel"
                    label="Image Model"
                    description="Used for image generation and understanding"
                    items={imageModelItems}
                    control={form.control}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-6 mt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={createAppMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAppMutation.isPending || !form.formState.isValid}
                className="ml-2"
              >
                {createAppMutation.isPending ? 'Creating...' : 'Create App'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
