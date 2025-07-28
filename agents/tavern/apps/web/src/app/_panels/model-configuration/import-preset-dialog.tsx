'use client'

import type { RefObject } from 'react'
import { useState } from 'react'
import { modelPresetSchema } from '@tavern/core'
import { toast } from 'sonner'

import { Input } from '@cared/ui/components/input'

import { useCreateModelPreset } from '@/hooks/use-model-preset'

export function ImportPresetDialog({
  ref: fileInputRef,
  onImport,
  existingPresets,
}: {
  ref: RefObject<HTMLInputElement | null>
  onImport: (name: string) => Promise<void>
  existingPresets: { name: string }[]
}) {
  const [isImporting, setIsImporting] = useState(false)

  const createModelPreset = useCreateModelPreset()

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
      const preset = JSON.parse(text)

      // Validate the preset using schema
      const validatedPreset = modelPresetSchema.parse(preset)

      // Get name from file name without extension
      const name = file.name.replace(/\.json$/, '')

      // Check if name exists and add suffix if needed
      let finalName = name
      let counter = 1
      while (existingPresets.some((p) => p.name === finalName)) {
        finalName = `${name} (${counter})`
        counter++
      }

      await createModelPreset(finalName, validatedPreset)
      await onImport(finalName)
      toast.success('Preset imported successfully')
    } catch (error) {
      console.error(error)
      // toast.error('Failed to import preset: invalid file format')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Input
      ref={fileInputRef}
      type="file"
      accept=".json"
      onChange={handleFileChange}
      disabled={isImporting}
      className="hidden"
    />
  )
}
