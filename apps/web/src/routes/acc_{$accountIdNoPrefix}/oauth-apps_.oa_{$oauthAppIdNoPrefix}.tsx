import type { ComponentProps } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { CheckIcon, CopyIcon, XIcon } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod/v4';



import type { RouterOutputs } from '@cared/api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cared/ui/components/breadcrumb';
import { Button } from '@cared/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cared/ui/components/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@cared/ui/components/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@cared/ui/components/field';
import { Input } from '@cared/ui/components/input';
import { Label } from '@cared/ui/components/label';
import { CircleSpinner } from '@cared/ui/components/spinner';
import { Textarea } from '@cared/ui/components/textarea';



import type { OAuthAppScopesFormValues } from '@/components/oauth-apps/oauth-app-scopes-fields';
import { LocalImage, RemoteImage } from '@/components/image';
import { InputWithEndAction } from '@/components/input-with-end-action';
import { buildSelectedScopes, OAuthAppScopesFields, oauthAppScopesFormSchema, organizeApiScopes, parseScopesToFormValues } from '@/components/oauth-apps/oauth-app-scopes-fields';
import { SectionTitle } from '@/components/section';
import { SkeletonCard } from '@/components/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs';
import { UploadLogo } from '@/components/upload-logo';
import { useActiveAccount } from '@/hooks/use-active';
import { useDeleteOAuthApp, useListOAuthAppScopes, useOAuthApp, useRotateOAuthAppSecret, useUpdateOAuthApp } from '@/hooks/use-oauth-app';
import { orpc } from '@/lib/orpc';
import { addIdPrefix } from '@/lib/utils';
import defaultLogo from '/images/oauth-app-default.svg';


export const Route = createFileRoute(
  '/acc_{$accountIdNoPrefix}/oauth-apps_/oa_{$oauthAppIdNoPrefix}',
)({
  loader: ({ context, params }) => {
    const oauthAppId = addIdPrefix(params.oauthAppIdNoPrefix, 'oa')
    void context.queryClient.prefetchQuery(
      orpc.account.oauthApp.get.queryOptions({
        input: { id: oauthAppId },
      }),
    )
    void context.queryClient.prefetchQuery(orpc.account.oauthApp.listScopes.queryOptions())
  },
  component: OAuthAppDetailPage,
})

function OAuthAppDetailPage() {
  const { accountIdNoPrefix, oauthAppIdNoPrefix } = Route.useParams()
  const oauthAppId = addIdPrefix(oauthAppIdNoPrefix, 'oa')

  return (
    <Suspense fallback={<SkeletonCard />}>
      <OAuthAppDetail accountIdNoPrefix={accountIdNoPrefix} oauthAppId={oauthAppId} />
    </Suspense>
  )
}

type OAuthApp = RouterOutputs['account']['oauthApp']['get']['oauthApp']

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      *
    </span>
  )
}

function OAuthAppLogo({ logo, name }: { logo?: string | null; name: string }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md">
      {logo ? (
        <RemoteImage src={logo} alt={name} fill className="object-cover" />
      ) : (
        <LocalImage src={defaultLogo} alt="OAuth App Logo" fill className="object-cover" />
      )}
    </div>
  )
}

function OAuthAppDetail({
  accountIdNoPrefix,
  oauthAppId,
}: {
  accountIdNoPrefix: string
  oauthAppId: string
}) {
  const activeAccount = useActiveAccount()

  const { oauthApp } = useOAuthApp(oauthAppId)

  const [showSecretDialog, setShowSecretDialog] = useState(false)
  const [secretToShow, setSecretToShow] = useState<string>()

  useEffect(() => {
    if (!showSecretDialog) {
      setSecretToShow(undefined)
    }
  }, [showSecretDialog])

  return (
    <>
      <SectionTitle
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/acc_{$accountIdNoPrefix}/oauth-apps"
                    params={{ accountIdNoPrefix }}
                  >
                    OAuth Apps
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0 max-w-sm">
                <BreadcrumbPage className="text-2xl font-bold flex items-center gap-2 min-w-0">
                  <OAuthAppLogo logo={oauthApp.logo} name={oauthApp.name} />
                  <span className="truncate min-w-0">{oauthApp.name}</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

      <div className="space-y-6">
        <OAuthAppProfile oauthApp={oauthApp} activeAccountId={activeAccount?.id} />
        <OAuthAppRedirectUris oauthApp={oauthApp} />
        <OAuthAppCredentials
          oauthApp={oauthApp}
          showSecretDialog={showSecretDialog}
          setShowSecretDialog={setShowSecretDialog}
          secretToShow={secretToShow}
          setSecretToShow={setSecretToShow}
        />
        <Suspense fallback={<SkeletonCard />}>
          <OAuthAppScopes oauthApp={oauthApp} />
        </Suspense>
        <OAuthAppDangerZone oauthApp={oauthApp} accountIdNoPrefix={accountIdNoPrefix} />
      </div>
    </>
  )
}

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64, 'Name cannot exceed 64 characters'),
  description: z.string().max(256, 'Description cannot exceed 256 characters').optional(),
  homeUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

function OAuthAppProfile({
  oauthApp,
  activeAccountId,
}: {
  oauthApp: OAuthApp
  activeAccountId?: string
}) {
  const { updateOAuthApp, isUpdating } = useUpdateOAuthApp()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: oauthApp.name,
      description: oauthApp.description ?? '',
      homeUrl: oauthApp.homeUrl ?? '',
    },
  })

  useEffect(() => {
    form.reset({
      name: oauthApp.name,
      description: oauthApp.description ?? '',
      homeUrl: oauthApp.homeUrl ?? '',
    })
  }, [form, oauthApp.description, oauthApp.homeUrl, oauthApp.name])

  const isDirty = form.formState.isDirty

  const onSubmit = useCallback(
    async (data: ProfileFormValues) => {
      await updateOAuthApp({
        id: oauthApp.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        homeUrl: data.homeUrl?.trim() || null,
      })
      toast.success('OAuth App updated')
    },
    [oauthApp.id, updateOAuthApp],
  )

  const onLogoUrlChange = useCallback(
    async (logoUrl: string) => {
      if (logoUrl !== oauthApp.logo) {
        await updateOAuthApp({
          id: oauthApp.id,
          logo: logoUrl || null,
        })
      }
    },
    [oauthApp.id, oauthApp.logo, updateOAuthApp],
  )

  return (
    <Card>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field className="max-w-3xl">
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
              <Field className="max-w-3xl">
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
              <Field className="max-w-3xl">
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

          {activeAccountId && (
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <UploadLogo
                location={{
                  type: 'account',
                  accountId: activeAccountId,
                }}
                logoUrl={oauthApp.logo}
                onLogoUrlChange={onLogoUrlChange}
                defaultLogo={defaultLogo}
              />
            </Field>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating || !isDirty}>
              {isUpdating ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function OAuthAppScopes({ oauthApp }: { oauthApp: OAuthApp }) {
  const { updateOAuthApp, isUpdating } = useUpdateOAuthApp()
  const {
    data: { scopes: availableScopes },
  } = useListOAuthAppScopes()

  const organizedApiScopes = useMemo(() => organizeApiScopes(availableScopes), [availableScopes])

  const form = useForm<OAuthAppScopesFormValues>({
    resolver: zodResolver(oauthAppScopesFormSchema),
    defaultValues: parseScopesToFormValues(oauthApp.scopes ?? [], organizedApiScopes),
  })

  useEffect(() => {
    form.reset(parseScopesToFormValues(oauthApp.scopes ?? [], organizedApiScopes))
  }, [form, oauthApp.scopes, organizedApiScopes])

  const isDirty = form.formState.isDirty

  const onSubmit = useCallback(
    async (data: OAuthAppScopesFormValues) => {
      const selectedScopes = buildSelectedScopes(data, organizedApiScopes)
      if (selectedScopes.length === 0) {
        form.setError('root', {
          message: 'Select at least one permission scope',
        })
        return
      }

      await updateOAuthApp({
        id: oauthApp.id,
        scopes: selectedScopes,
      })
      toast.success('OAuth App scopes updated')
    },
    [form, oauthApp.id, organizedApiScopes, updateOAuthApp],
  )

  return (
    <Card>
      <CardContent className="space-y-8 pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          <OAuthAppScopesFields
            control={form.control}
            organizedApiScopes={organizedApiScopes}
            idPrefix="edit-"
          />

          {form.formState.errors.root && <FieldError errors={[form.formState.errors.root]} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating || !isDirty}>
              {isUpdating ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function OAuthAppRedirectUris({ oauthApp }: { oauthApp: OAuthApp }) {
  const { updateOAuthApp, isUpdating } = useUpdateOAuthApp()
  const [redirectUris, setRedirectUris] = useState<string[]>(oauthApp.redirectUris)
  const [newRedirectUri, setNewRedirectUri] = useState('')
  const [redirectUrisError, setRedirectUrisError] = useState<string>()

  const checkNewRedirectUri = useCallback(() => {
    if (!newRedirectUri.trim()) {
      setRedirectUrisError(undefined)
      return true
    }

    if (!isHttpUrl(newRedirectUri)) {
      setRedirectUrisError('URL must use HTTP or HTTPS protocol')
      return false
    }

    if (redirectUris.includes(newRedirectUri.trim())) {
      setRedirectUrisError('Duplicate redirect URIs are not allowed')
      return false
    }

    setRedirectUrisError(undefined)
    return true
  }, [newRedirectUri, redirectUris])

  const handleAddRedirectUri = useCallback(() => {
    if (!newRedirectUri.trim() || !checkNewRedirectUri()) {
      return
    }

    const updatedUris = [...redirectUris, newRedirectUri.trim()]
    setRedirectUris(updatedUris)
    void updateOAuthApp({
      id: oauthApp.id,
      redirectUris: updatedUris,
    }).then(() => {
      setNewRedirectUri('')
    })
  }, [checkNewRedirectUri, newRedirectUri, oauthApp.id, redirectUris, updateOAuthApp])

  const handleRemoveRedirectUri = useCallback(
    (uriToRemove: string) => {
      const updatedUris = redirectUris.filter((uri) => uri !== uriToRemove)
      if (updatedUris.length === 0) {
        toast.error('At least one redirect URI is required')
        return
      }
      setRedirectUris(updatedUris)
      void updateOAuthApp({
        id: oauthApp.id,
        redirectUris: updatedUris,
      })
    },
    [oauthApp.id, redirectUris, updateOAuthApp],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Redirect URIs <RequiredMark />
        </CardTitle>
        <CardDescription>
          For OAuth requests, the provided URI must exactly match one of the listed URIs. Specify at
          least one URI for authentication to work.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <InputWithEndAction
              value={newRedirectUri}
              onChange={(e) => setNewRedirectUri(e.target.value)}
              className="font-mono"
              placeholder="https://example.com/auth/callback"
              onBlur={checkNewRedirectUri}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddRedirectUri()
                }
              }}
              endAction={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 text-primary"
                  onClick={handleAddRedirectUri}
                  disabled={!newRedirectUri || isUpdating}
                >
                  Add
                </Button>
              }
            />
            {redirectUrisError && (
              <p className="text-[0.8rem] font-medium text-destructive">{redirectUrisError}</p>
            )}
          </div>

          {redirectUris.length > 0 && (
            <div className="space-y-2">
              {redirectUris.map((uri) => (
                <div
                  key={uri}
                  className="flex min-w-0 items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-mono" title={uri}>
                    {uri}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 hover:text-primary"
                    onClick={() => handleRemoveRedirectUri(uri)}
                    disabled={isUpdating}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function OAuthAppCredentials({
  oauthApp,
  showSecretDialog,
  setShowSecretDialog,
  secretToShow,
  setSecretToShow,
}: {
  oauthApp: OAuthApp
  showSecretDialog: boolean
  setShowSecretDialog: (show: boolean) => void
  secretToShow?: string
  setSecretToShow: (secret: string) => void
}) {
  const { rotateOAuthAppSecret, isRotating } = useRotateOAuthAppSecret()
  const [showRotateDialog, setShowRotateDialog] = useState(false)

  const handleRotateSecret = useCallback(async () => {
    const data = await rotateOAuthAppSecret(oauthApp.id)
    const rotatedSecret = data.oauthApp.clientSecret
    if (rotatedSecret) {
      setSecretToShow(rotatedSecret)
    }
    setShowSecretDialog(true)
    setShowRotateDialog(false)
  }, [oauthApp.id, rotateOAuthAppSecret, setSecretToShow, setShowSecretDialog])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Application Credentials</CardTitle>
          <CardDescription>OAuth credentials for confidential and public clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="confidential">
            <TabsList>
              <TabsTrigger value="confidential">Confidential</TabsTrigger>
              <TabsTrigger value="public">Public</TabsTrigger>
            </TabsList>

            <TabsContent value="confidential" className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground">
                For server-side applications that can securely store a client secret.
              </p>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <InputWithEndAction
                  value={oauthApp.clientId}
                  readOnly
                  className="font-mono"
                  endAction={<CopyButton value={oauthApp.clientId} />}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <InputWithEndAction
                  value={`${oauthApp.clientSecretStart}**************************${oauthApp.clientSecretEnd}`}
                  readOnly
                  className="font-mono"
                  endAction={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 text-primary"
                      onClick={() => setShowRotateDialog(true)}
                    >
                      Regenerate
                    </Button>
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="public" className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground">
                For native or mobile apps that cannot securely store a client secret.
              </p>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <InputWithEndAction
                  value={oauthApp.publicClientId}
                  readOnly
                  className="font-mono"
                  endAction={<CopyButton value={oauthApp.publicClientId} />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Secret</DialogTitle>
            <DialogDescription>
              Copy your client secret now. You will not be able to view it again.
            </DialogDescription>
          </DialogHeader>
          <InputWithEndAction
            value={secretToShow ?? ''}
            readOnly
            className="font-mono"
            endAction={<CopyButton value={secretToShow ?? ''} />}
          />
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
              This will invalidate the current secret and generate a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRotateDialog(false)}
              disabled={isRotating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRotateSecret()}
              disabled={isRotating}
            >
              {isRotating ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Regenerating...
                </>
              ) : (
                'Regenerate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OAuthAppDangerZone({
  oauthApp,
  accountIdNoPrefix,
}: {
  oauthApp: OAuthApp
  accountIdNoPrefix: string
}) {
  const router = useRouter()
  const { deleteOAuthApp, isDeleting } = useDeleteOAuthApp()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = useCallback(async () => {
    await deleteOAuthApp(oauthApp.id)
    toast.success('OAuth App deleted')
    void router.navigate({
      to: '/acc_{$accountIdNoPrefix}/oauth-apps',
      params: { accountIdNoPrefix },
    })
  }, [accountIdNoPrefix, deleteOAuthApp, oauthApp.id, router])

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Permanently delete this OAuth App and revoke all associated tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          Delete OAuth App
        </Button>
      </CardContent>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OAuth App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{oauthApp.name}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <CircleSpinner className="h-4 w-4" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function CopyButton({ value, ...props }: { value: string } & ComponentProps<typeof Button>) {
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
    <Button variant="outline" size="icon" onClick={copy} {...props}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
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
