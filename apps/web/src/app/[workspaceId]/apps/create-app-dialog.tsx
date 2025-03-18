'use client'

import { useState } from 'react'
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

import { useTRPC } from '@/trpc/client'

// Form schema for creating a new app
const createAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  type: z.enum(['single-agent', 'multiple-agents']),
  languageModel: z.string().min(1, 'Language model is required'),
  embeddingModel: z.string().min(1, 'Embedding model is required'),
  rerankModel: z.string().min(1, 'Rerank model is required'),
  imageModel: z.string().min(1, 'Image model is required'),
})

type CreateAppFormValues = z.infer<typeof createAppSchema>

interface CreateAppDialogProps {
  workspaceId: string
}

export function CreateAppDialog({ workspaceId }: CreateAppDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Get models data for selection
  const { data: modelsData } = useSuspenseQuery(trpc.model.listModels.queryOptions())

  // Set up form with validation
  const form = useForm<CreateAppFormValues>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'single-agent',
      // Default to the first available model of each type
      languageModel: modelsData.models.language?.[0]?.id || '',
      embeddingModel: modelsData.models['text-embedding']?.[0]?.id || '',
      rerankModel: modelsData.models['text-embedding']?.[0]?.id || '', // Using embedding for rerank as fallback
      imageModel: modelsData.models.image?.[0]?.id || '',
    },
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
  function onSubmit(values: CreateAppFormValues) {
    createAppMutation.mutate({
      workspaceId,
      name: values.name,
      metadata: {
        description: values.description,
        languageModel: values.languageModel,
        embeddingModel: values.embeddingModel,
        rerankModel: values.rerankModel,
        imageModel: values.imageModel,
      },
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

                  <FormField
                    control={form.control}
                    name="languageModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modelsData.models.language?.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select embedding model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modelsData.models['text-embedding']?.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Used for embedding memories and knowledge</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rerankModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rerank Model</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rerank model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modelsData.models['text-embedding']?.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Used for reranking search results</FormDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select image model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modelsData.models.image?.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
              <Button type="submit" disabled={createAppMutation.isPending} className="ml-2">
                {createAppMutation.isPending ? 'Creating...' : 'Create App'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
