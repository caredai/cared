import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ArtifactSuggestion } from '@mindworld/db/schema'

import { Artifact } from '@/components/create-artifact'
import { DiffView } from '@/components/diffview'
import { DocumentSkeleton } from '@/components/document-skeleton'
import { ClockRewind, CopyIcon, MessageIcon, PenIcon, RedoIcon, UndoIcon } from '@/components/icons'
import { Editor } from '@/components/text-editor'
import { useTRPC } from '@/lib/api'

export interface TextArtifactMetadata {
  suggestions: ArtifactSuggestion[]
}

export const textArtifact = new Artifact<'text', TextArtifactMetadata>({
  kind: 'text',
  description: 'Useful for text content, like drafting essays and emails.',
  initialize: ({ setMetadata }) => {
    setMetadata({
      suggestions: [],
    })
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [
            ...metadata.suggestions,
            streamPart.content as ArtifactSuggestion,
          ],
        }
      })
    }

    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + (streamPart.content as string),
          isVisible:
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
          status: 'streaming',
        }
      })
    }
  },
  content: ({
    artifactId,
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getArtifactContentById,
    isLoading,
    metadata,
    setMetadata,
  }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const trpc = useTRPC()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const suggestions = useQuery(
      trpc.artifact.listSuggestions.queryOptions({
        artifactId,
      }),
    ).data?.suggestions
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      setMetadata((metadata) => {
        return {
          suggestions: [
            ...metadata.suggestions,
            ...(suggestions ?? []),
          ],
        }
      })
    }, [setMetadata, suggestions])

    if (isLoading) {
      return <DocumentSkeleton artifactKind="text" />
    }

    if (mode === 'diff') {
      const oldContent = getArtifactContentById(currentVersionIndex - 1)
      const newContent = getArtifactContentById(currentVersionIndex)

      return <DiffView oldContent={oldContent} newContent={newContent} />
    }

    return (
      <>
        <div className="flex flex-row py-8 md:p-20 px-4">
          <Editor
            content={content}
            suggestions={metadata.suggestions}
            isCurrentVersion={isCurrentVersion}
            currentVersionIndex={currentVersionIndex}
            status={status}
            onSaveContent={onSaveContent}
          />

          {metadata.suggestions.length > 0 ? (
            <div className="md:hidden h-dvh w-12 shrink-0" />
          ) : null}
        </div>
      </>
    )
  },
  actions: [
    {
      icon: <ClockRewind size={18} />,
      description: 'View changes',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('toggle')
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true
        }

        return false
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev')
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true
        }

        return false
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next')
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true
        }

        return false
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        void navigator.clipboard.writeText(content)
        toast.success('Copied to clipboard!')
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add final polish',
      onClick: ({ appendMessage }) => {
        void appendMessage({
          role: 'user',
          content:
            'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
        })
      },
    },
    {
      icon: <MessageIcon />,
      description: 'Request suggestions',
      onClick: ({ appendMessage }) => {
        void appendMessage({
          role: 'user',
          content: 'Please add suggestions you have that could improve the writing.',
        })
      },
    },
  ],
})
