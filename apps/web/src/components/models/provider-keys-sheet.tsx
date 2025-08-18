'use client'

import type { VirtualizerHandle } from 'virtua'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, EditIcon, PlusIcon, ServerIcon, Trash2Icon, XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Virtualizer } from 'virtua'
import { z } from 'zod/v4'

import { BaseProviderInfo, ProviderId, providerKeySchema } from '@cared/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Button } from '@cared/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cared/ui/components/form'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@cared/ui/components/sheet'
import { Switch } from '@cared/ui/components/switch'

import { OptionalInput, OptionalTextarea } from '@/components/input'
import {
  useCreateProviderKey,
  useDeleteProviderKey,
  useProviderKeysByProvider,
  useUpdateProviderKey,
} from '@/hooks/use-provider-key'

// Temporary ID prefix for new items that haven't been submitted yet
const TEMP_ID_PREFIX = 'temp_'

// Form schema for provider key creation/editing
const providerKeyFormSchema = z.object({
  disabled: z.boolean(),
  key: providerKeySchema,
})

type ProviderKeyFormValues = z.infer<typeof providerKeyFormSchema>

// Helper function to get default values for a provider
function getDefaultValuesForProvider(providerId: ProviderId): ProviderKeyFormValues['key'] {
  return {
    providerId,
    apiKey: '',
    baseUrl: '',
    apiVersion: undefined,
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
    location: undefined,
    serviceAccountJson: '',
    apiToken: '',
  }
}

interface EditableProviderKey {
  id: string
  providerId: ProviderId
  key: {
    providerId: ProviderId
    apiKey?: string
    baseUrl?: string
    apiVersion?: string
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
    location?: string
    serviceAccountJson?: string
    apiToken?: string
  }
  disabled: boolean
  isEditing: boolean
  isNew?: boolean
}

export function ProviderKeysSheet({
  provider,
  open,
  onOpenChange,
}: {
  provider?: BaseProviderInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const providerId = provider?.id
  const { providerKeys, refetchProviderKeys } = useProviderKeysByProvider(providerId)
  const vListRef = useRef<VirtualizerHandle>(null)
  const createProviderKey = useCreateProviderKey()
  const updateProviderKey = useUpdateProviderKey()
  const deleteProviderKey = useDeleteProviderKey()

  // State for managing new items
  const [newKeys, setNewKeys] = useState<EditableProviderKey[]>([])

  useEffect(() => {
    setNewKeys([])
  }, [open])

  const [allKeys, setAllKeys] = useState<EditableProviderKey[]>([])

  // Transform provider keys to editable format and merge with temporary items
  useEffect(() => {
    const existingKeys = providerKeys.map((key) => ({
      id: key.id,
      providerId: key.providerId,
      key: {
        ...getDefaultValuesForProvider(key.providerId),
        ...key.key,
      },
      disabled: key.disabled,
      isEditing: false,
      isNew: false,
    }))

    setAllKeys([...newKeys, ...existingKeys])
  }, [providerKeys, newKeys])

  // Handle adding new provider key
  const handleAddNew = useCallback(() => {
    if (!providerId) {
      return
    }

    const newKey: EditableProviderKey = {
      id: `${TEMP_ID_PREFIX}${Date.now()}`,
      providerId,
      key: getDefaultValuesForProvider(providerId),
      disabled: false,
      isEditing: true,
      isNew: true,
    }

    setNewKeys((prev) => [newKey, ...prev])

    // Scroll to the first item (new item)
    setTimeout(() => {
      vListRef.current?.scrollToIndex(0, { align: 'start', smooth: true })
    }, 100)
  }, [providerId])

  // Handle editing existing provider key
  const handleEdit = useCallback((id: string) => {
    setAllKeys((prev) => prev.map((key) => (key.id === id ? { ...key, isEditing: true } : key)))
  }, [])

  // Handle canceling edits
  const handleCancel = useCallback((id: string) => {
    setAllKeys((prev) => prev.map((key) => (key.id === id ? { ...key, isEditing: false } : key)))
  }, [])

  // Handle saving changes
  const handleSave = useCallback(
    async (id: string, formData: ProviderKeyFormValues) => {
      if (!providerId) {
        return
      }

      if (id.startsWith(TEMP_ID_PREFIX)) {
        // This is a new key, create it via API
        await createProviderKey({
          key: formData.key,
          disabled: formData.disabled,
        })

        await refetchProviderKeys()

        // Remove the temporary item from local state
        setNewKeys((prev) => prev.filter((key) => key.id !== id))
      } else {
        // This is an existing key, update it via API
        await updateProviderKey({
          id,
          key: formData.key,
          disabled: formData.disabled,
        })

        // Update local state
        setAllKeys((prev) =>
          prev.map((key) => (key.id === id ? { ...key, isEditing: false } : key)),
        )
      }
    },
    [createProviderKey, updateProviderKey, providerId, refetchProviderKeys],
  )

  // Handle removing temporary items or deleting existing ones
  const handleRemove = useCallback(
    async (id: string) => {
      if (id.startsWith(TEMP_ID_PREFIX)) {
        // This is a temporary item, just remove from local state
        setNewKeys((prev) => prev.filter((key) => key.id !== id))
        return
      }

      // This is an existing key, delete it via API
      await deleteProviderKey(id)

      // Remove from local state
      setAllKeys((prev) => prev.filter((key) => key.id !== id))
    },
    [deleteProviderKey],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px]">
        <SheetHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage
              src={provider?.icon ? `/images/providers/${provider.icon}` : undefined}
              alt={provider?.name}
            />
            <AvatarFallback>
              <ServerIcon />
            </AvatarFallback>
          </Avatar>
          <SheetTitle>{provider?.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 px-4 pb-4 overflow-y-auto [overflow-anchor:none]">
          {allKeys.length === 0 ? (
            // Empty state with add button
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-4">
                <p className="text-lg font-medium">No API keys found for {provider?.name}</p>
                <p className="text-sm">You can add an API key</p>
              </div>
              <Button onClick={handleAddNew} size="sm">
                <PlusIcon />
                Add API Key
              </Button>
            </div>
          ) : (
            // Existing keys list
            <Virtualizer ref={vListRef} count={allKeys.length + 1}>
              {(index) => {
                if (index === 0) {
                  return (
                    <div className="mb-4 flex justify-end">
                      <Button onClick={handleAddNew} size="sm">
                        <PlusIcon />
                        Add
                      </Button>
                    </div>
                  )
                }

                const key = allKeys[index - 1]!

                return (
                  <ProviderKeyItem
                    key={key.id}
                    providerKey={key}
                    onEdit={() => handleEdit(key.id)}
                    onCancel={() => handleCancel(key.id)}
                    onSave={(formData) => handleSave(key.id, formData)}
                    onRemove={() => handleRemove(key.id)}
                  />
                )
              }}
            </Virtualizer>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ProviderKeyItem({
  providerKey,
  onEdit,
  onCancel,
  onSave,
  onRemove,
}: {
  providerKey: EditableProviderKey
  onEdit: () => void
  onCancel: () => void
  onSave: (formData: ProviderKeyFormValues) => void
  onRemove: () => void
}) {
  if (providerKey.isEditing) {
    return (
      <ProviderKeyItemEdit
        providerKey={providerKey}
        onCancel={onCancel}
        onSave={onSave}
        onRemove={onRemove}
      />
    )
  } else {
    return <ProviderKeyItemView providerKey={providerKey} onEdit={onEdit} onRemove={onRemove} />
  }
}

function ProviderKeyItemView({
  providerKey,
  onEdit,
  onRemove,
}: {
  providerKey: EditableProviderKey
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="border rounded-lg p-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">API Key</span>
            {providerKey.disabled && (
              <span className="text-xs bg-muted px-2 py-1 rounded">Disabled</span>
            )}
            {providerKey.isNew && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">New</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {providerKey.key.apiKey && (
              <div>API Key: {formatDecryptedKey(providerKey.key.apiKey)}</div>
            )}
            {providerKey.key.baseUrl && <div>Base URL: {providerKey.key.baseUrl}</div>}
            {providerKey.key.apiVersion && <div>API Version: {providerKey.key.apiVersion}</div>}
            {providerKey.key.region && <div>Region: {providerKey.key.region}</div>}
            {providerKey.key.location && <div>Location: {providerKey.key.location}</div>}
            {providerKey.key.serviceAccountJson && (
              <div>Service Account JSON: {providerKey.key.serviceAccountJson}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-6" onClick={onEdit}>
            <EditIcon className="size-3" />
          </Button>
          <Button variant="outline" size="icon" className="size-6" onClick={onRemove}>
            <Trash2Icon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const emptyValuesForEncryptedFields = {
  apiKey: '',
  accessKeyId: '',
  secretAccessKey: '',
  serviceAccountJson: '',
  apiToken: '',
}

function ProviderKeyItemEdit({
  providerKey,
  onCancel,
  onSave,
  onRemove,
}: {
  providerKey: EditableProviderKey
  onCancel: () => void
  onSave: (formData: ProviderKeyFormValues) => void
  onRemove: () => void
}) {
  const form = useForm<ProviderKeyFormValues>({
    resolver: zodResolver(providerKeyFormSchema),
    defaultValues: {
      disabled: providerKey.disabled,
      key: {
        ...providerKey.key,
        ...emptyValuesForEncryptedFields,
        ...(providerKey.providerId !== 'azure' && {
          baseUrl: providerKey.key.baseUrl ? providerKey.key.baseUrl : undefined,
        }),
      },
    },
  })

  const handleSave = async () => {
    const formData = form.getValues()
    console.log('formData:', formData)
    if (await form.trigger()) {
      const formData = form.getValues()
      onSave(formData)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  return (
    <div className="border rounded-lg p-4 my-4 bg-muted/50">
      <Form {...form}>
        <form className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{providerKey.isNew ? 'New API Key' : 'Edit API Key'}</h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-6" onClick={handleCancel}>
                <XIcon className="size-3" />
              </Button>
              <Button
                size="icon"
                className="size-6"
                onClick={(e) => {
                  e.preventDefault()
                  void handleSave()
                }}
              >
                <CheckIcon className="size-3" />
              </Button>
              <Button variant="outline" size="icon" className="size-6" onClick={onRemove}>
                <Trash2Icon className="size-3" />
              </Button>
            </div>
          </div>

          {/* API Key - for non-bedrock, non-vertex, non-replicate providers */}
          {!['bedrock', 'vertex', 'replicate'].includes(providerKey.providerId) && (
            <FormField
              control={form.control}
              name="key.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <OptionalInput type="password" placeholder="Enter API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Base URL */}
          <FormField
            control={form.control}
            name="key.baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL {providerKey.providerId !== 'azure' && '(Optional)'}</FormLabel>
                <FormControl>
                  <OptionalInput placeholder="Enter base URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Azure-specific fields */}
          {providerKey.providerId === 'azure' && (
            <FormField
              control={form.control}
              name="key.apiVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Version (Optional)</FormLabel>
                  <FormControl>
                    <OptionalInput placeholder="Enter API version" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Bedrock-specific fields */}
          {providerKey.providerId === 'bedrock' && (
            <>
              <FormField
                control={form.control}
                name="key.region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <OptionalInput placeholder="Enter region" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key.accessKeyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Key ID</FormLabel>
                    <FormControl>
                      <OptionalInput placeholder="Enter access key ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key.secretAccessKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Access Key</FormLabel>
                    <FormControl>
                      <OptionalInput
                        type="password"
                        placeholder="Enter secret access key"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Vertex-specific fields */}
          {providerKey.providerId === 'vertex' && (
            <>
              <FormField
                control={form.control}
                name="key.location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <OptionalInput placeholder="Enter location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key.serviceAccountJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Account JSON</FormLabel>
                    <FormControl>
                      <OptionalTextarea
                        placeholder="Enter service account JSON content"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Replicate-specific fields */}
          {providerKey.providerId === 'replicate' && (
            <FormField
              control={form.control}
              name="key.apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <OptionalInput type="password" placeholder="Enter API token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Disabled switch */}
          <FormField
            control={form.control}
            name="disabled"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel>Disabled</FormLabel>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}

function formatDecryptedKey(key: string): string {
  return key + '••••••••'
}
