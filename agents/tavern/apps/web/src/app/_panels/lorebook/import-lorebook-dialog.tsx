'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { lorebookEntriesSchema } from '@tavern/core'
import { atom, useAtom } from 'jotai'
import { toast } from 'sonner'

import { Input } from '@ownxai/ui/components/input'

import { useCreateLorebook, useLorebooks } from '@/hooks/use-lorebook'
import { useSelectedLorebook } from './select-lorebook'

const refAtom = atom({ current: null as HTMLInputElement | null })

export function useImportLorebookFileInputRef() {
  const [ref] = useAtom(refAtom)
  return ref
}

export function ImportLorebookDialog({ trigger }: { trigger: ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, setRefState] = useAtom(refAtom)

  useEffect(() => {
    setRefState(fileInputRef)
  }, [fileInputRef, setRefState])

  const [isImporting, setIsImporting] = useState(false)

  const { lorebooks } = useLorebooks()
  const createLorebook = useCreateLorebook()

  const { setSelectedLorebookId } = useSelectedLorebook()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file')
      return
    }

    setIsImporting(true)
    try {
      const text = await file.text()
      const lorebook = JSON.parse(text)

      // Validate the entries using schema
      const validatedEntries = lorebookEntriesSchema.parse(lorebook.entries)

      // Get name from file name without extension
      const name = file.name.replace(/\.json$/, '')

      // Check if name exists and add suffix if needed
      let finalName = name
      let counter = 1
      while (lorebooks.some((p) => p.name === finalName)) {
        finalName = `${name} (${counter})`
        counter++
      }

      const {
        lorebook: { id },
      } = await createLorebook(finalName, undefined, validatedEntries)

      setSelectedLorebookId(id)

      toast.success('Lorebook imported successfully')
    } catch (error) {
      console.error(error)
      // toast.error('Failed to import lorebook: invalid file format')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex justify-center items-center">
      {trigger}
      <Input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        disabled={isImporting}
        className="hidden"
      />
    </div>
  )
}
