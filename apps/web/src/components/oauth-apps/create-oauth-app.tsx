import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { Button } from '@cared/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cared/ui/components/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@cared/ui/components/field'
import { Input } from '@cared/ui/components/input'
import { CircleSpinner } from '@cared/ui/components/spinner'
import { Textarea } from '@cared/ui/components/textarea'

import { CopyButton } from '@/components/copy-button'
import {
  buildDefaultApiScopes,
  buildSelectedScopes,
  oauthAppScopesFormSchema,
  OAuthAppScopesFields,
  organizeApiScopes,
  syncApiScopesFormValues,
} from '@/components/oauth-apps/oauth-app-scopes-fields'
import { UploadLogo } from '@/components/upload-logo'
import { useActiveAccount } from '@/hooks/use-active'
import { useCreateOAuthApp, useListOAuthAppScopes } from '@/hooks/use-oauth-app'
import { stripIdPrefix } from '@/lib/utils'
import defaultLogo from '/images/oauth-app-default.svg'

const createOAuthAppSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters'),
  description: z.string().max(256, 'Description cannot exceed 256 characters').optional(),
  homeUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  logo: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  redirectUris: z
    .array(
      z.object({
        uri: z
          .string()
          .url('Please enter a valid URL')
          .refine(isHttpUrl, 'URL must use HTTP or HTTPS protocol'),
      }),
    )
    .min(1, 'At least one redirect URI is required')
    .refine((items) => {
      const uris = items.map((item) => item.uri)
      return new Set(uris).size === uris.length
    }, 'Duplicate redirect URIs are not allowed'),
}).merge(oauthAppScopesFormSchema)

type CreateOAuthAppFormValues = z.infer<typeof createOAuthAppSchema>

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  )
}

function isHttpUrl(url: string) {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export function CreateOAuthApp({ accountIdNoPrefix }: { accountIdNoPrefix: string }) {
  const router = useRouter()
  const activeAccount = useActiveAccount()
  const createOAuthApp = useCreateOAuthApp()
  const [isCreating, setIsCreating] = useState(false)
  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>()
  const [createdAppId, setCreatedAppId] = useState<string>()

  const {
    data: { scopes },
  } = useListOAuthAppScopes()

  const organizedApiScopes = useMemo(() => organizeApiScopes(scopes), [scopes])

  const defaultApiScopes = useMemo(
    () => buildDefaultApiScopes(organizedApiScopes),
    [organizedApiScopes],
  )

  const form = useForm<CreateOAuthAppFormValues>({
    resolver: zodResolver(createOAuthAppSchema),
    defaultValues: {
      name: '',
      description: '',
      homeUrl: '',
      logo: '',
      redirectUris: [{ uri: '' }],
      standardScopes: {
        openid: true,
        profile: true,
        email: true,
        offline_access: true,
      },
      apiScopes: defaultApiScopes,
    },
  })

  useEffect(() => {
    form.setValue(
      'apiScopes',
      syncApiScopesFormValues(form.getValues('apiScopes'), organizedApiScopes),
      { shouldDirty: false, shouldValidate: false },
    )
  }, [form, organizedApiScopes])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'redirectUris',
  })

  const logoUrl = form.watch('logo')

  const onSubmit = async (data: CreateOAuthAppFormValues) => {
    const selectedScopes = buildSelectedScopes(data, organizedApiScopes)
    if (selectedScopes.length === 0) {
      form.setError('root', {
        message: 'Select at least one permission scope',
      })
      return
    }

    try {
      setIsCreating(true)
      const description = data.description?.trim()
      const homeUrl = data.homeUrl?.trim()
      const logo = data.logo?.trim()

      const result = await createOAuthApp({
        name: data.name.trim(),
        redirectUris: data.redirectUris.map((item) => item.uri.trim()),
        scopes: selectedScopes,
        ...(description ? { description } : {}),
        ...(homeUrl ? { homeUrl } : {}),
        ...(logo ? { logo } : {}),
      })

      setCreatedAppId(result.oauthApp.id)
      setClientSecret(result.oauthApp.clientSecret)
      setShowSecretDialog(true)
      form.reset()
    } catch (error) {
      console.error('Failed to create OAuth app:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSecretDialogClose = (nextOpen: boolean) => {
    setShowSecretDialog(nextOpen)
    if (!nextOpen && createdAppId) {
      void router.navigate({
        to: '/acc_{$accountIdNoPrefix}/oauth-apps/oa_{$oauthAppIdNoPrefix}',
        params: {
          accountIdNoPrefix,
          oauthAppIdNoPrefix: stripIdPrefix(createdAppId),
        },
      })
      setCreatedAppId(undefined)
      setClientSecret(undefined)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Register a new OAuth App for third-party integrations. Choose the permission scopes users
          can grant during authorization. You will receive a client secret that is shown only once.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          <div className="space-y-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    Name <RequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="MyApp"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <FieldDescription>
                    This description is displayed to all users of your application.
                  </FieldDescription>
                  <Textarea {...field} id={field.name} rows={3} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="homeUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Home URL</FieldLabel>
                  <FieldDescription>The full URL to your application homepage.</FieldDescription>
                  <Input
                    {...field}
                    id={field.name}
                    className="font-mono"
                    aria-invalid={fieldState.invalid}
                    placeholder="https://example.com"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {activeAccount && (
              <Field>
                <FieldLabel>Logo</FieldLabel>
                <UploadLogo
                  location={{
                    type: 'account',
                    accountId: activeAccount.id,
                  }}
                  logoUrl={logoUrl ?? undefined}
                  onLogoUrlChange={(url) => {
                    form.setValue('logo', url, { shouldDirty: true })
                  }}
                  defaultLogo={defaultLogo}
                />
              </Field>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <FieldLabel className="text-base font-semibold">
                  Redirect URIs <RequiredMark />
                </FieldLabel>
                <FieldDescription>
                  For OAuth requests, the provided URI must exactly match one of the listed URIs.
                  Specify at least one URI for authentication to work.
                </FieldDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ uri: '' })}>
                <PlusIcon className="h-4 w-4" />
                Add URI
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Controller
                  name={`redirectUris.${index}.uri`}
                  control={form.control}
                  render={({ field: uriField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="flex-1">
                      <Input
                        {...uriField}
                        className="font-mono"
                        placeholder="https://example.com/auth/callback"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  className="h-9 w-9"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <OAuthAppScopesFields control={form.control} organizedApiScopes={organizedApiScopes} />

          {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <CircleSpinner />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showSecretDialog} onOpenChange={handleSecretDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Secret</DialogTitle>
            <DialogDescription>
              Copy your client secret now. You will not be able to view it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input value={clientSecret ?? ''} readOnly className="font-mono" />
            {clientSecret && <CopyButton value={clientSecret} />}
          </div>
          <DialogFooter>
            <Button onClick={() => handleSecretDialogClose(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
