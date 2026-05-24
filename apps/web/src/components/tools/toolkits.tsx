import type { VirtualizerHandle } from 'virtua'
import { useMemo, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Check, ChevronsUpDown, Wrench } from 'lucide-react'
import { Virtualizer } from 'virtua'

import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Badge } from '@cared/ui/components/badge'
import { Button } from '@cared/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cared/ui/components/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@cared/ui/components/command'
import { Popover, PopoverContent, PopoverTrigger } from '@cared/ui/components/popover'
import { cn } from '@cared/ui/lib/utils'

import { SearchInput } from '@/components/search-input'
import { useCategories, useToolkits } from '@/hooks/use-tools'

interface Category {
  slug: string
  name: string
}

interface StandardCategory {
  id: string
  name: string
}

interface Toolkit {
  name: string
  slug: string
  meta?: {
    categories?: Category[]
    description?: string
    logo?: string
    toolsCount?: number
  }
  authSchemes?: string[]
  noAuth?: boolean
}

/**
 * Toolkits component
 * Displays toolkits with category filtering and search functionality
 */
export function Toolkits() {
  const toolkitsData = useToolkits()
  // Type assertion to ensure type safety
  const toolkits = toolkitsData as Toolkit[]
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const router = useRouter()

  // Get accountIdNoPrefix from current route
  const getAccountIdNoPrefix = () => {
    try {
      const match = /\/acc_([^/]+)/.exec(router.state.location.pathname)
      if (match?.[1]) {
        return match[1]
      }
    } catch {
      // Fallback: return undefined
    }
    return undefined
  }

  // Get standardized categories from API
  const standardCategoriesData = useCategories()
  // Type assertion to ensure type safety
  const standardCategories = standardCategoriesData as StandardCategory[]

  // Preprocess data: extract categories from toolkits (using first category of each toolkit)
  // Use slug from toolkits meta, but get standardized name from useCategories
  const { categories, toolkitsWithCategory } = useMemo(() => {
    // Create a map from category id/slug to standardized name
    const categoryNameMap = new Map<string, string>()
    for (const category of standardCategories) {
      categoryNameMap.set(category.id, category.name)
    }

    const categoryMap = new Map<string, Category>()
    const toolkitCategoryMap = new Map<string, Category | undefined>()
    // Count toolkits per category
    const categoryCountMap = new Map<string, number>()

    // Process each toolkit to extract its first category
    for (const toolkit of toolkits) {
      const firstCategory = toolkit.meta?.categories?.[0]
      if (firstCategory) {
        // Use slug from toolkit meta, but get standardized name from useCategories
        const standardizedName = categoryNameMap.get(firstCategory.slug) ?? firstCategory.name
        const standardizedCategory: Category = {
          slug: firstCategory.slug,
          name: standardizedName,
        }
        categoryMap.set(firstCategory.slug, standardizedCategory)
        toolkitCategoryMap.set(toolkit.slug, standardizedCategory)
        // Increment count for this category
        const currentCount = categoryCountMap.get(firstCategory.slug) ?? 0
        categoryCountMap.set(firstCategory.slug, currentCount + 1)
      }
    }

    // Convert map to array and sort by toolkit count (descending), then by name
    const categoriesArray = Array.from(categoryMap.values()).sort((a, b) => {
      const countA = categoryCountMap.get(a.slug) ?? 0
      const countB = categoryCountMap.get(b.slug) ?? 0
      // Sort by count descending first
      if (countA !== countB) {
        return countB - countA
      }
      // If counts are equal, sort by name
      return a.name.localeCompare(b.name)
    })

    return {
      categories: categoriesArray,
      toolkitsWithCategory: toolkitCategoryMap,
    }
  }, [toolkits, standardCategories])

  // Filter toolkits based on selected category and search term
  const filteredToolkits = useMemo(() => {
    const result: Toolkit[] = []
    for (const toolkit of toolkits) {
      // Filter by category
      if (selectedCategory) {
        const toolkitCategory = toolkitsWithCategory.get(toolkit.slug)
        if (toolkitCategory?.slug !== selectedCategory) {
          continue
        }
      }

      // Filter by search term (name and description)
      if (searchTerm) {
        const name = toolkit.name.toLowerCase()
        const description = toolkit.meta?.description?.toLowerCase() ?? ''
        const search = searchTerm.toLowerCase()
        if (!name.includes(search) && !description.includes(search)) {
          continue
        }
      }

      result.push(toolkit)
    }
    return result
  }, [toolkits, selectedCategory, searchTerm, toolkitsWithCategory])

  return (
    <div className="flex h-full gap-4">
      {/* Left sidebar: Categories - hidden on small screens, visible on md and larger */}
      <div className="hidden md:block w-48 lg:w-64 flex-shrink-0 h-2/3 border rounded-lg overflow-y-auto">
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Right content area: Search and Toolkits */}
      {/* Toolkits grid with search bar as first item */}
      <div className="flex-1 overflow-y-auto">
        <ToolkitGrid
          toolkits={filteredToolkits}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onToolkitClick={(toolkit) => {
            const accountIdNoPrefix = getAccountIdNoPrefix()
            if (accountIdNoPrefix) {
              void navigate({
                to: '/acc_{$accountIdNoPrefix}/tools/{$toolkit}',
                params: {
                  accountIdNoPrefix,
                  toolkit: toolkit.slug,
                },
              })
            }
          }}
        />
      </div>
    </div>
  )
}

/**
 * CategoryList component
 * Virtualized list of categories for selection
 */
function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}) {
  const categoryListRef = useRef<VirtualizerHandle>(null)

  return (
    <Virtualizer ref={categoryListRef}>
      {/* "All" option */}
      <CategoryItem
        category={{ slug: 'all', name: 'All' }}
        isSelected={selectedCategory === null}
        onSelect={() => onSelectCategory(null)}
      />
      {/* Category items */}
      {categories.map((category) => (
        <CategoryItem
          key={category.slug}
          category={category}
          isSelected={selectedCategory === category.slug}
          onSelect={() => onSelectCategory(category.slug)}
        />
      ))}
    </Virtualizer>
  )
}

/**
 * CategoryItem component
 * Individual category item in the list
 */
function CategoryItem({
  category,
  isSelected,
  onSelect,
}: {
  category: { slug: string; name: string }
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant={isSelected ? 'secondary' : 'ghost'}
      className={cn(
        'w-full text-left truncate line-clamp-1 rounded-none font-normal',
        isSelected && 'bg-secondary',
      )}
      onClick={onSelect}
    >
      {category.name}
    </Button>
  )
}

/**
 * CategoryCombobox component
 * Category selector using Popover and Command for md and larger screens
 */
function CategoryCombobox({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  // Get selected category name
  const selectedCategoryName = selectedCategory
    ? (categories.find((cat) => cat.slug === selectedCategory)?.name ?? 'All')
    : 'All'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[300px] justify-between"
        >
          {selectedCategoryName}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {/* "All" option */}
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelectCategory(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedCategory === null ? 'opacity-100' : 'opacity-0',
                  )}
                />
                All
              </CommandItem>
              {/* Category items */}
              {categories.map((category) => (
                <CommandItem
                  key={category.slug}
                  value={category.slug}
                  onSelect={(currentValue) => {
                    onSelectCategory(currentValue === selectedCategory ? null : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCategory === category.slug ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * ToolkitGrid component
 * Virtualized grid of toolkit cards with responsive columns
 * Search bar and category selector are included as the first items in the virtual list
 */
function ToolkitGrid({
  toolkits,
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  onToolkitClick,
}: {
  toolkits: Toolkit[]
  searchTerm: string
  onSearchChange: (value: string) => void
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  onToolkitClick: (toolkit: Toolkit) => void
}) {
  const gridRef = useRef<VirtualizerHandle>(null)

  // Calculate rows based on responsive columns (2 on mobile, 3 on desktop)
  // We'll render items in rows, where each row contains 2-3 items
  const rows = useMemo(() => {
    const itemsPerRow = 3 // Default for desktop, will be adjusted by CSS
    const rows: Toolkit[][] = []
    for (let i = 0; i < toolkits.length; i += itemsPerRow) {
      rows.push(toolkits.slice(i, i + itemsPerRow))
    }
    return rows
  }, [toolkits])

  return (
    <Virtualizer ref={gridRef}>
      {/* Search bar as first item in virtual list */}
      <div className="m-[1px]">
        <SearchInput
          placeholder="Search toolkits by name or description..."
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {/* Category selector - visible only on small screens (< md) */}
      <div className="flex md:hidden m-[1px] mt-4">
        <CategoryCombobox
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* Empty state */}
      {toolkits.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground mt-4">
          <p>No toolkits found</p>
        </div>
      ) : (
        /* Toolkit rows */
        rows.map((row, index) => {
          // Use first toolkit slug as key, or generate a unique key based on index
          const rowKey = row[0]?.slug ?? `row-${index}`
          return (
            <div
              key={rowKey}
              className={cn(
                'grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4',
                index === rows.length - 1 && 'mb-4',
              )}
            >
              {row.map((toolkit) => (
                <ToolkitCard
                  key={toolkit.slug}
                  toolkit={toolkit}
                  onClick={() => onToolkitClick(toolkit)}
                />
              ))}
            </div>
          )
        })
      )}
    </Virtualizer>
  )
}

/**
 * ToolkitCard component
 * Individual toolkit card displaying logo, name, slug, description, auth schemes, and tools count
 */
function ToolkitCard({ toolkit, onClick }: { toolkit: Toolkit; onClick: () => void }) {
  const hasAuthSchemes = Boolean(toolkit.authSchemes && toolkit.authSchemes.length > 0)
  const hasToolsCount = toolkit.meta?.toolsCount !== undefined
  const showFooter = hasAuthSchemes || hasToolsCount

  return (
    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {/* Logo */}
          <Avatar className="w-8 h-8 rounded-lg flex-shrink-0">
            {toolkit.meta?.logo ? (
              <AvatarImage src={toolkit.meta.logo} alt={toolkit.name} className="object-contain" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-muted">
              <span className="text-lg font-semibold text-muted-foreground">
                {toolkit.name.charAt(0).toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{toolkit.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{toolkit.slug}</p>
          </div>
        </div>
      </CardHeader>
      {toolkit.meta?.description && (
        <CardContent className="flex-1">
          <CardDescription className="line-clamp-3">{toolkit.meta.description}</CardDescription>
        </CardContent>
      )}
      {showFooter && (
        <CardFooter className="justify-between text-xs text-muted-foreground">
          {/* Auth schemes */}
          {hasAuthSchemes && toolkit.authSchemes && (
            <div className="flex items-center gap-1 flex-wrap">
              {toolkit.authSchemes.map((scheme) => (
                <Badge key={scheme} variant="outline" className="font-mono">
                  {scheme}
                </Badge>
              ))}
            </div>
          )}
          {/* Tools count */}
          {hasToolsCount && toolkit.meta?.toolsCount !== undefined && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              <span>{toolkit.meta.toolsCount}</span>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
