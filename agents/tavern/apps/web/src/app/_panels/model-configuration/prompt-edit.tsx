import type { Prompt } from '@tavern/core'
import type { z } from 'zod'
import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Portal from '@radix-ui/react-portal'
import { promptSchema } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { XIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@ownxai/ui/components/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@ownxai/ui/components/form'
import { Input } from '@ownxai/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ownxai/ui/components/select'
import { Textarea } from '@ownxai/ui/components/textarea'
import { cn } from '@ownxai/ui/lib/utils'

import { useCustomizeModelPreset } from '@/hooks/use-model-preset'
import { usePrompt } from '@/hooks/use-prompt'
import { useContentAreaRef, useIsShowPromptEdit } from '@/hooks/use-show-in-content-area'

const editPromptIdAtom = atom<string>()

export function usePromptEdit() {
  const [editPromptId, setEditPromptId] = useAtom(editPromptIdAtom)

  const { isShowPromptEdit, setIsShowPromptEdit } = useIsShowPromptEdit()

  const openPromptEdit = (identifier: string) => {
    setEditPromptId(identifier)
    setIsShowPromptEdit(true)
  }

  const closePromptEdit = () => {
    setEditPromptId(undefined)
    setIsShowPromptEdit(false)
  }

  const toggleEditPromptEdit = (identifier: string) => {
    if (editPromptId && editPromptId !== identifier) {
      setEditPromptId(identifier)
      return
    }
    const isShow = !isShowPromptEdit
    setEditPromptId(isShow ? identifier : undefined)
    setIsShowPromptEdit(isShow)
  }

  useEffect(() => {
    if (!isShowPromptEdit) {
      setEditPromptId(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowPromptEdit])

  const prompt = usePrompt(editPromptId)
  const promptEdit = useMemo(
    () => ({
      ...prompt,
      name: prompt?.name ?? '',
      role: prompt?.role ?? 'system',
      injection_position: prompt?.injection_position ?? 'relative',
      injection_depth: prompt?.injection_depth ?? 4,
      content: prompt?.content ?? '',
    }),
    [prompt],
  )

  return {
    isShowPromptEdit,
    prompt,
    promptEdit,
    openPromptEdit,
    closePromptEdit,
    toggleEditPromptEdit,
  }
}

const promptEditFormSchema = promptSchema.pick({
  name: true,
  role: true,
  injection_position: true,
  injection_depth: true,
  content: true,
})

export function PromptEdit() {
  const { isShowPromptEdit, prompt, promptEdit, closePromptEdit } = usePromptEdit()
  const { contentAreaRef } = useContentAreaRef()

  const form = useForm({
    resolver: zodResolver(promptEditFormSchema),
    defaultValues: promptEdit,
  })

  const [depthInput, setDepthInput] = useState('')

  useEffect(() => {
    form.reset(promptEdit)
    setDepthInput(promptEdit.injection_depth.toString())
  }, [promptEdit, form])

  const { customization, saveCustomization } = useCustomizeModelPreset()

  const onSubmit = (values: typeof promptEditFormSchema._type) => {
    if (!prompt) {
      return
    }

    const newPrompt = {
      ...promptEdit,
      ...values,
    }

    const newCustomization = {
      ...customization,
      prompts: {
        ...customization?.prompts,
        [prompt.identifier]: newPrompt,
      },
    }

    void saveCustomization(newCustomization)
  }

  if (!isShowPromptEdit || !prompt) {
    return null
  }

  return (
    <Portal.Root
      container={contentAreaRef?.current}
      className="absolute top-0 w-full h-full z-5000 p-4 flex flex-col gap-6 overflow-y-auto bg-background border border-border rounded-lg shadow-lg"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">
          <span className="truncate">{prompt.name}</span>{' '}
          <span className="text-md text-muted-foreground">
            - Prompt Edit
            {prompt.system_prompt || prompt.marker ? (
              <span className="text-sm">
                {' '}
                ({prompt.system_prompt ? `System prompt: ${prompt.identifier}` : ''}
                {prompt.system_prompt && prompt.marker ? '; ' : ''}
                {prompt.marker ? `Marker: true` : ''})
              </span>
            ) : null}
          </span>
        </h1>

        <Button variant="outline" size="icon" className="size-6" onClick={closePromptEdit}>
          <XIcon />
        </Button>
      </div>

      <Form {...form}>
        <form
          onBlur={() => {
            onSubmit(promptEditFormSchema.parse(sanitizeValues(prompt, form.getValues())))
          }}
          className="flex-1 flex flex-col gap-6"
        >
          <div className="flex justify-between gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Name</FormLabel>
                  <FormDescription>A name for this prompt</FormDescription>
                  <FormControl>
                    <Input {...field} maxLength={128} placeholder="Enter prompt name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Role</FormLabel>
                  <FormDescription>To whom this message will be attributed</FormDescription>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={prompt.marker}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-6000">
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between gap-6">
            <FormField
              control={form.control}
              name="injection_position"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Position</FormLabel>
                  <FormDescription>
                    Injection position: relative (to other prompts in prompt list) or absolute @
                    depth
                  </FormDescription>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={prompt.system_prompt && !prompt.marker}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-6000">
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="absolute">Absolute</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="injection_depth"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    'flex-1',
                    form.watch('injection_position') !== 'absolute' && 'hidden',
                  )}
                >
                  <FormLabel>Depth</FormLabel>
                  <FormDescription>
                    Injection depth: 0 = after the last message, 1 = before the last message, etc
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={depthInput}
                      onChange={(e) => {
                        setDepthInput(e.target.value)
                      }}
                      onBlur={() => {
                        const numValue = parseInt(depthInput)
                        if (!isNaN(numValue) && numValue >= 0) {
                          setDepthInput(numValue.toString())
                          field.onChange(numValue)
                        } else {
                          // Reset to previous valid value if invalid
                          setDepthInput(field.value?.toString() ?? '')
                        }
                      }}
                      placeholder="Enter depth"
                      disabled={form.watch('injection_position') !== 'absolute'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('injection_position') !== 'absolute' && <div className="flex-1" />}
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel>Prompt</FormLabel>
                <FormDescription>The prompt to be sent</FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={prompt.marker}
                    placeholder={
                      !prompt.marker
                        ? 'Enter prompt content'
                        : 'The content of this marker prompt is pulled from elsewhere and cannot be edited here'
                    }
                    className="flex-1 min-h-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Portal.Root>
  )
}

function sanitizeValues(prompt: Prompt, values: z.infer<typeof promptEditFormSchema>) {
  return {
    name: values.name,
    role: !prompt.marker ? values.role : undefined,
    content: !prompt.marker ? values.content : undefined,
    injection_position: values.injection_position,
    injection_depth: values.injection_position === 'absolute' ? values.injection_depth : undefined,
  }
}
