'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon, CopyIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@mindworld/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mindworld/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from '@mindworld/ui/components/label'
import { Switch } from '@mindworld/ui/components/switch'

import { CircleSpinner } from '@/components/spinner'
import { useTRPC } from '@/trpc/client'

// Form schema for OAuth app configuration
const oauthAppSchema = z.object({
  redirectUris: z
    .array(
      z.object({
        uri: z
          .string()
          .url('Please enter a valid URL')
          .refine((url) => {
            try {
              const parsedUrl = new URL(url)
              return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
            } catch {
              return false
            }
          }, 'URL must use HTTP or HTTPS protocol'),
      }),
    )
    .min(1, 'At least one redirect URI is required'),
  disabled: z.boolean().default(false),
})

type OAuthAppFormValues = z.infer<typeof oauthAppSchema>

// Copy button component with state management
function CopyButton({ value }: { value: string }) {
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(value)
    clearTimeout(timeoutHandle.current)
    timeoutHandle.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
    setCopied(true)
  }, [value])

  return (
    <Button variant="outline" size="icon" onClick={copy}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  )
}

export function OAuthApp({ appId }: { appId: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [showRotateDialog, setShowRotateDialog] = useState(false)
  const [secretToShow, setSecretToShow] = useState<string | null>(null)

  const {
    data: { oauthApps },
  } = useSuspenseQuery({
    ...trpc.oauthApp.list.queryOptions({
      appId,
    }),
  })
  const oauthApp = oauthApps.at(0)?.oauthApp

  // Form setup
  const form = useForm<OAuthAppFormValues>({
    resolver: zodResolver(oauthAppSchema),
    defaultValues: {
      redirectUris: [{ uri: '' }],
      disabled: false,
    },
  })

  // Setup field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'redirectUris',
  })

  // Update form values when OAuth app data is loaded
  useEffect(() => {
    form.reset({
      redirectUris: oauthApp?.redirectUris.length
        ? oauthApp.redirectUris.map((uri) => ({ uri }))
        : [{ uri: '' }],
      disabled: oauthApp?.disabled ?? false,
    })
  }, [oauthApp, form])

  // Create OAuth app mutation
  const createMutation = useMutation({
    ...trpc.oauthApp.create.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.oauthApp.list.queryKey({ appId }),
        })
        // Show secret dialog after successful creation
        setSecretToShow(data.oauthApp.clientSecret!)
        setShowSecretDialog(true)
        // Reset form state after successful creation
        form.reset({
          redirectUris: [{ uri: '' }],
          disabled: false,
        })
      },
      onError: (error) => {
        toast.error(`Failed to create OAuth app: ${error.message}`)
      },
    }),
  })

  // Update OAuth app mutation
  const updateMutation = useMutation({
    ...trpc.oauthApp.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.oauthApp.list.queryKey({ appId }),
        })
        // Reset form state after successful update
        form.reset({
          redirectUris: oauthApp?.redirectUris.length
            ? oauthApp.redirectUris.map((uri) => ({ uri }))
            : [{ uri: '' }],
          disabled: oauthApp?.disabled ?? false,
        })
      },
      onError: (error) => {
        toast.error(`Failed to update OAuth app: ${error.message}`)
      },
    }),
  })

  const rotateSecretMutation = useMutation({
    ...trpc.oauthApp.rotateSecret.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.oauthApp.list.queryKey({ appId }),
        })
        // Show secret dialog after successful rotation
        setSecretToShow(data.oauthApp.clientSecret!)
        setShowSecretDialog(true)
        setShowRotateDialog(false)
      },
      onError: (error) => {
        toast.error(`Failed to rotate OAuth app client secret: ${error.message}`)
      },
    }),
  })

  // Handle form submission
  const onSubmit = useCallback(
    async (data: OAuthAppFormValues) => {
      const submitData = {
        ...data,
        redirectUris: data.redirectUris.map((item) => item.uri),
      }

      if (oauthApp) {
        await updateMutation.mutateAsync({
          appId,
          ...submitData,
        })
      } else {
        await createMutation.mutateAsync({
          appId,
          ...submitData,
        })
      }
    },
    [appId, createMutation, oauthApp, updateMutation],
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Application Configuration</CardTitle>
          <CardDescription>
            Configure your OAuth application settings for authentication and authorization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>Redirect URIs</FormLabel>
                    <FormDescription>
                      These are the URLs where users will be redirected after authentication.
                    </FormDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ uri: '' })}
                    className="h-8"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add URI
                  </Button>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`redirectUris.${index}.uri`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="https://example.com/callback"
                                {...field}
                                className="font-mono"
                                onBlur={() => {
                                  field.onBlur()
                                  void form.trigger(`redirectUris.${index}.uri`)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        className="h-10 w-10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="disabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Disable Application</FormLabel>
                      <FormDescription>
                        When disabled, the OAuth application will not accept any new authentication
                        requests.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <CardFooter className="px-0">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <CircleSpinner className="h-4 w-4" />
                      {oauthApp ? 'Updating...' : 'Creating...'}
                    </>
                  ) : oauthApp ? (
                    'Update OAuth App'
                  ) : (
                    'Create OAuth App'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {oauthApp && (
        <Card>
          <CardHeader>
            <CardTitle>Application Credentials</CardTitle>
            <CardDescription>
              Your OAuth application credentials. Keep these secure and never share them publicly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <div className="flex items-center gap-2">
                <Input value={oauthApp.clientId!} readOnly className="font-mono" />
                <CopyButton value={oauthApp.clientId!} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client Secret</Label>
              <div className="relative">
                <Input
                  value={`${oauthApp.clientSecretStart ?? ''}••••••••••••••••••••••••••`}
                  readOnly
                  className="font-mono pr-32"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowRotateDialog(true)}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Secret</DialogTitle>
            <DialogDescription>
              This is your client secret. Make sure to copy it now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={secretToShow ?? ''} readOnly className="font-mono" />
            <CopyButton value={secretToShow ?? ''} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRotateDialog} onOpenChange={setShowRotateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Client Secret</DialogTitle>
            <DialogDescription>
              Are you sure you want to rotate the client secret? This will invalidate the current secret and generate a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRotateDialog(false)}
              disabled={rotateSecretMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rotateSecretMutation.mutate({ appId })}
              disabled={rotateSecretMutation.isPending}
            >
              {rotateSecretMutation.isPending ? (
                <>
                  <CircleSpinner className="h-4 w-4 mr-2" />
                  Regenerate...
                </>
              ) : (
                'Regenerate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
