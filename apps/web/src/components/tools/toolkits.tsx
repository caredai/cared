'use client'

import { useMemo, useRef, useState } from 'react'
import type { VirtualizerHandle } from 'virtua'
import { Virtualizer } from 'virtua'

import { Button } from '@cared/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@cared/ui/components/card'
import { cn } from '@cared/ui/lib/utils'

import { SearchInput } from '@/components/search-input'
import { ToolkitSheet } from './toolkit-sheet'
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
  const [selectedToolkit, setSelectedToolkit] = useState<Toolkit | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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

      // Filter by search term (name)
      if (searchTerm) {
        const name = toolkit.name.toLowerCase()
        const search = searchTerm.toLowerCase()
        if (!name.includes(search)) {
          continue
        }
      }

      result.push(toolkit)
    }
    return result
  }, [toolkits, selectedCategory, searchTerm, toolkitsWithCategory])

  return (
    <div className="flex h-full gap-4">
      {/* Left sidebar: Categories */}
      <div className="w-64 flex-shrink-0 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Categories</h2>
        </div>
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Right content area: Search and Toolkits */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search bar */}
        <div className="p-4 border-b">
          <SearchInput
            placeholder="Search toolkits by name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Toolkits grid */}
        <div className="flex-1 overflow-auto">
          <ToolkitGrid
            toolkits={filteredToolkits}
            onToolkitClick={(toolkit) => {
              setSelectedToolkit(toolkit)
              setIsSheetOpen(true)
            }}
          />
        </div>
      </div>

      {/* Toolkit Sheet */}
      {selectedToolkit && (
        <ToolkitSheet
          toolkit={selectedToolkit}
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open)
            if (!open) {
              setSelectedToolkit(null)
            }
          }}
        />
      )}
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
    <div className="h-full overflow-auto">
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
    </div>
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
        'w-full justify-start rounded-none',
        isSelected && 'bg-secondary',
      )}
      onClick={onSelect}
    >
      {category.name}
    </Button>
  )
}

/**
 * ToolkitGrid component
 * Virtualized grid of toolkit cards with responsive columns
 */
function ToolkitGrid({
  toolkits,
  onToolkitClick,
}: {
  toolkits: Toolkit[]
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

  if (toolkits.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No toolkits found</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Virtualizer ref={gridRef}>
        {rows.map((row, index) => {
          // Use first toolkit slug as key, or generate a unique key based on index
          const rowKey = row[0]?.slug ?? `row-${index}`
          return (
            <div
              key={rowKey}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
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
        })}
      </Virtualizer>
    </div>
  )
}

/**
 * ToolkitCard component
 * Individual toolkit card displaying logo, name, description, and tools count
 */
function ToolkitCard({
  toolkit,
  onClick,
}: {
  toolkit: Toolkit
  onClick: () => void
}) {
  return (
    <Card
      className="h-full hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          {/* Logo */}
          {toolkit.meta?.logo ? (
            <img
              src={toolkit.meta.logo}
              alt={toolkit.name}
              className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-muted-foreground">
                {toolkit.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{toolkit.name}</CardTitle>
            {toolkit.meta?.toolsCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {toolkit.meta.toolsCount} {toolkit.meta.toolsCount === 1 ? 'tool' : 'tools'}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      {toolkit.meta?.description && (
        <CardContent>
          <CardDescription className="line-clamp-3">
            {toolkit.meta.description}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  )
}
