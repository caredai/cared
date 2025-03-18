'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSuspenseQuery } from '@tanstack/react-query'
import { BotIcon, CheckIcon, CopyIcon, FilterIcon, SearchIcon, TagIcon, XIcon } from 'lucide-react'
import NextImage from 'next-image-export-optimizer'
import { useCopyToClipboard } from 'react-use'

import { Badge } from '@mindworld/ui/components/badge'
import { Button } from '@mindworld/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@mindworld/ui/components/card'
import { Input } from '@mindworld/ui/components/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@mindworld/ui/components/select'
import { Separator } from '@mindworld/ui/components/separator'

import { useTRPC } from '@/trpc/client'
import { CreateAppDialog } from './create-app-dialog'

// Define App interface based on schema
interface App {
  app: {
    id: string
    name: string
    type: 'single-agent' | 'multiple-agents'
    metadata: {
      description?: string
      imageUrl?: string
      languageModel: string
      embeddingModel: string
      rerankModel: string
      imageModel: string
    }
  }
  categories: string[]
  tags: string[]
}

// Constant for all categories filter value
const ALL_CATEGORIES = 'all'

export function Apps() {
  const trpc = useTRPC()
  const params = useParams<{ workspaceId: string }>()
  const [_, copyToClipboard] = useCopyToClipboard()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES)

  // Get workspace apps list
  const { data } = useSuspenseQuery(
    trpc.app.list.queryOptions({
      workspaceId: params.workspaceId,
      limit: 100,
    }),
  )

  // Get all categories
  const { data: categoriesData } = useSuspenseQuery(
    trpc.app.listCategories.queryOptions({
      limit: 100,
    }),
  )

  // Copy ID functionality
  const handleCopyId = useCallback(
    (id: string) => {
      copyToClipboard(id)
      setCopiedId(id)
      setTimeout(() => {
        setCopiedId(null)
      }, 2000)
    },
    [copyToClipboard],
  )

  // Search and filter functionality
  const filteredApps = data.apps.filter((appData: App) => {
    const matchesSearch =
      searchTerm === '' ||
      appData.app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appData.app.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appData.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory =
      selectedCategory === ALL_CATEGORIES || appData.categories.includes(selectedCategory)

    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight truncate">Apps</h1>
          <p className="text-muted-foreground mt-2">Manage and deploy your AI agent applications</p>
        </div>
        <CreateAppDialog workspaceId={params.workspaceId} />
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <div className="flex items-center">
                <FilterIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by category">
                  {selectedCategory === ALL_CATEGORIES ? 'All categories' : selectedCategory}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_CATEGORIES} className="flex items-center">
                  <div className="flex items-center">
                    <XIcon className="mr-2 h-4 w-4" />
                    All categories
                  </div>
                </SelectItem>
                <Separator className="my-1" />
                <SelectLabel className="text-muted-foreground">Categories</SelectLabel>
                {categoriesData.categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
            {data.apps.length === 0 ? (
              <>
                <h3 className="text-lg font-medium">No Apps</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  You haven't created any apps yet. Click the button below to get started.
                </p>
                <CreateAppDialog workspaceId={params.workspaceId} />
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium">No Matching Apps</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6">
                  Try using different search criteria or clear your filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory(ALL_CATEGORIES)
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((appData: App) => (
            <Card key={appData.app.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="truncate">
                    <Link
                      href={`/${params.workspaceId}/apps/${appData.app.id}`}
                      className="hover:underline"
                    >
                      {appData.app.name}
                    </Link>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    title="Copy App ID"
                    onClick={() => handleCopyId(appData.app.id)}
                  >
                    {copiedId === appData.app.id ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {appData.app.metadata.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                {appData.app.metadata.imageUrl ? (
                  <div className="relative h-40 w-full mb-3 rounded-md overflow-hidden">
                    <NextImage
                      src={appData.app.metadata.imageUrl}
                      alt={appData.app.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback to default image if error
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 w-full mb-3 rounded-md bg-muted">
                    <BotIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="font-medium mr-2">Type:</span>
                  <span>
                    {appData.app.type === 'single-agent' ? 'Single Agent' : 'Multiple Agents'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className="font-medium mr-2">Language Model:</span>
                  <span className="truncate">{appData.app.metadata.languageModel}</span>
                </div>
              </CardContent>
              {(appData.categories.length > 0 || appData.tags.length > 0) && (
                <>
                  <Separator />
                  <CardFooter className="pt-3">
                    <div className="flex flex-wrap gap-2">
                      {appData.categories.map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                      {appData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="flex items-center gap-1 cursor-pointer"
                          onClick={() => setSearchTerm(tag)}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
