import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { BotIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod/v4'

import { defaultModels } from '@cared/providers'
import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cared/ui/components/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Input } from '@cared/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cared/ui/components/select'
import { Textarea } from '@cared/ui/components/textarea'

import { ModelSelect } from '@/components/models/model-select'
import { useActive } from '@/hooks/use-active'
import { orpc } from '@/lib/orpc'
import { stripIdPrefix } from '@/lib/utils'

// Schema for app form values
const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: z.enum(['single-agent', 'multiple-agents']),
  languageModel: z.string().min(1, 'Language model is required'),
  embeddingModel: z.string().min(1, 'Embedding model is required'),
  imageModel: z.string().min(1, 'Image model is required'),
})

type CreateAppFormValues = z.infer<typeof createAppSchema>

export function CreateAppDialog({
  menu,
  trigger,
  onSuccess,
}: {
  menu?: (props: { trigger: (props: { children: ReactNode }) => ReactNode }) => ReactNode
  trigger?: ReactNode
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { activeAccount } = useActive()

  const queryClient = useQueryClient()

  // Get models data for selection
  const { data: modelsData } = useSuspenseQuery(orpc.account.model.listProvidersModels.queryOptions())

  // Process model data with memoization to improve performance
  const { languageModelProviders, embeddingModelProviders, imageModelProviders } = useMemo(() => {
    return {
      languageModelProviders: modelsData.models.language ?? [],
      embeddingModelProviders: modelsData.models.textEmbedding ?? [],
      imageModelProviders: modelsData.models.image ?? [],
    }
  }, [modelsData.models])

  // Compute default model values with memoization
  const defaultValues = useMemo(() => {
    // Get first available model from each type
    const firstLanguageModel = modelsData.models.language?.at(0)?.models.at(0)?.id
    const firstEmbeddingModel = modelsData.models.textEmbedding?.at(0)?.models.at(0)?.id
    const firstImageModel = modelsData.models.image?.at(0)?.models.at(0)?.id

    // Use API-provided default models or fallback to first available models
    const defaultLanguageModel =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      defaultModels.app.languageModel || firstLanguageModel
    const defaultEmbeddingModel =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      defaultModels.app.embeddingModel || firstEmbeddingModel
    const defaultImageModel =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      defaultModels.app.imageModel || firstImageModel

    return {
      name: '',
      description: '',
      type: 'single-agent' as const,
      languageModel: defaultLanguageModel,
      embeddingModel: defaultEmbeddingModel,
      imageModel: defaultImageModel,
    }
  }, [modelsData])

  // Set up form with validation
  const form = useForm<CreateAppFormValues>({
    resolver: zodResolver(createAppSchema),
    defaultValues,
  })

  // Create app mutation
  const createAppMutation = useMutation(
    orpc.account.app.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`App "${data.app.name}" created successfully`)
        setOpen(false)
        void queryClient.invalidateQueries(orpc.account.app.list.queryOptions())

        // Call onSuccess callback if provided, otherwise navigate to the new app page
        if (onSuccess) {
          onSuccess()
        } else {
          void router.navigate({ to: `/${data.app.accountId}/${data.app.id}` })
        }
      },
      onError: (error) => {
        console.error('Failed to create app:', error)
        toast.error(`Failed to create app: ${error.message}`)
      },
    }),
  )

  // Handle form submission
  async function onSubmit(values: CreateAppFormValues) {
    if (!activeAccount) {
      toast.error('No active account selected')
      return
    }

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
      if (values.languageModel !== defaultModels.app.languageModel) {
        metadata.languageModel = values.languageModel
      }

      if (values.embeddingModel !== defaultModels.app.embeddingModel) {
        metadata.embeddingModel = values.embeddingModel
      }

      if (values.imageModel !== defaultModels.app.imageModel) {
        metadata.imageModel = values.imageModel
      }

      createAppMutation.mutate({
        accountId: activeAccount.id,
        name: trimmedName,
        metadata,
      })
    })
  }

  const Menu = menu

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {Menu && (
        <Menu trigger={({ children }) => <DialogTrigger asChild>{children}</DialogTrigger>} />
      )}
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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

                  <FormField
                    control={form.control}
                    name="languageModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language Model</FormLabel>
                        <FormControl>
                          <ModelSelect
                            value={field.value as any}
                            onValueChange={field.onChange}
                            modelType="language"
                            providerModels={languageModelProviders}
                          />
                        </FormControl>
                        <FormDescription>The language model for text generation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="embeddingModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Embedding Model</FormLabel>
                        <FormControl>
                          <ModelSelect
                            value={field.value as any}
                            onValueChange={field.onChange}
                            modelType="textEmbedding"
                            providerModels={embeddingModelProviders}
                          />
                        </FormControl>
                        <FormDescription>Used for embedding memories and knowledge</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Model</FormLabel>
                        <FormControl>
                          <ModelSelect
                            value={field.value as any}
                            onValueChange={field.onChange}
                            modelType="image"
                            providerModels={imageModelProviders}
                          />
                        </FormControl>
                        <FormDescription>
                          Used for image generation and understanding
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
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
