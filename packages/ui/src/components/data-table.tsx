'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { cn } from '../lib/utils'
import { Button } from './button'
import { Checkbox } from './checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Spinner } from './spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /**
   * Array of column keys to search across. The search will look for matches in any of these columns.
   * Only valid keys from the data object are allowed.
   * @example ['name', 'email'] - searches in both name and email columns
   * @example ['title', 'description', 'category'] - searches across title, description, and category
   */
  searchKeys?: (keyof TData)[]
  searchPlaceholder?: string
  pageSizeOptions?: number[]
  defaultPageSize?: number
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  enableRowSelection?: boolean
  enableSorting?: boolean
  onSelectionChange?: (selection: RowSelectionState) => void
  bulkActions?: {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    action: (selectedRows: TData[]) => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }[]
  defaultSorting?: SortingState
  // Infinite scroll pagination props
  enableInfiniteScroll?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => Promise<unknown> | void
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKeys,
  searchPlaceholder = 'Search...',
  pageSizeOptions = [10, 20, 30, 40, 50],
  defaultPageSize = 10,
  pageSize,
  onPageSizeChange,
  enableRowSelection = false,
  enableSorting = false,
  onSelectionChange,
  bulkActions = [],
  defaultSorting = [],
  enableInfiniteScroll = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize ?? defaultPageSize,
  })
  const [globalFilter, setGlobalFilter] = React.useState('')

  // Sync controlled pageSize with internal pagination state
  React.useEffect(() => {
    if (pageSize !== undefined && pageSize !== pagination.pageSize) {
      setPagination((prev) => ({ ...prev, pageSize }))
    }
  }, [pageSize, pagination.pageSize])

  // Custom global filter function for multiple search keys
  const globalFilterFn = React.useCallback(
    (row: any, columnId: string, filterValue: string) => {
      if (!searchKeys || searchKeys.length === 0 || !filterValue) return true

      const searchValue = filterValue.toLowerCase()
      return searchKeys.some((key) => {
        const cellValue = row.getValue(key)
        if (cellValue == null) return false
        return String(cellValue).toLowerCase().includes(searchValue)
      })
    },
    [searchKeys],
  )

  // Handle row selection change
  const handleRowSelectionChange = React.useCallback(
    (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
      const newSelection =
        typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue
      setRowSelection(newSelection)
      onSelectionChange?.(newSelection)
    },
    [rowSelection, onSelectionChange],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: setPagination,
    enableRowSelection: enableRowSelection,
    enableSorting: enableSorting,
    globalFilterFn: searchKeys && searchKeys.length > 0 ? globalFilterFn : undefined,
    state: {
      sorting: enableSorting ? sorting : [],
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  })

  // Calculate pagination info
  const totalPages = enableInfiniteScroll
    ? Math.ceil(data.length / table.getState().pagination.pageSize)
    : table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const currentPageSize = table.getState().pagination.pageSize

  // Get selected rows data
  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
  const isAllSelected = table.getIsAllPageRowsSelected()

  // Handle select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      table.toggleAllPageRowsSelected(false)
    } else {
      table.toggleAllPageRowsSelected(true)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  // Handle go to page input
  const [goToPage, setGoToPage] = React.useState('')
  const [isEditingPage, setIsEditingPage] = React.useState(false)

  const handleGoToPage = () => {
    const pageIndex = parseInt(goToPage) - 1
    if (pageIndex >= 0 && pageIndex < totalPages) {
      table.setPageIndex(pageIndex)
      setGoToPage((pageIndex + 1).toString())
    } else {
      setGoToPage(currentPage.toString())
    }
    setIsEditingPage(false)
  }

  const handleGoToPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage()
    }
  }

  const handleGoToPageBlur = () => {
    handleGoToPage()
  }

  const handleGoToPageFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditingPage(true)
    // Select all text when input is focused
    setTimeout(() => {
      e.target.select()
    }, 0)
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        {searchKeys && searchKeys.length > 0 && (
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        )}

        {/* Bulk Actions */}
        {enableRowSelection && selectedRows.length > 0 && bulkActions.length > 0 && (
          <div className="flex items-center gap-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => action.action(selectedRows)}
                className="flex items-center gap-2"
              >
                {action.icon && <action.icon className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn('rounded-md border antialiased', className)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {/* Selection checkbox column */}
                {enableRowSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      className="translate-y-[2px]"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {enableSorting && header.column.getCanSort() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-4 w-4 p-0"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {header.column.getIsSorted() === 'asc' ? (
                                <ArrowUpIcon className="h-3 w-3" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <ArrowDownIcon className="h-3 w-3" />
                              ) : (
                                <ArrowUpDownIcon className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={row.getIsSelected() ? 'bg-muted/50' : ''}
                >
                  {/* Selection checkbox cell */}
                  {enableRowSelection && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label={`Select row ${row.id}`}
                        className="translate-y-[2px]"
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enableRowSelection ? columns.length + 1 : columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="flex items-center justify-between space-x-4 py-4 min-w-0">
          <div className="text-sm text-muted-foreground flex-shrink-0">
            {enableRowSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>

          {/* Pagination info and controls */}
          <div className="flex items-center space-x-8">
            {/* Page size selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Rows per page:
              </span>
              <Select
                value={currentPageSize.toString()}
                onValueChange={(value) => {
                  const newPageSize = Number(value)
                  table.setPageSize(newPageSize)
                  onPageSizeChange?.(newPageSize)
                }}
              >
                <SelectTrigger className="h-8 w-18">
                  <SelectValue placeholder={currentPageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-muted-foreground">Page</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                step={1}
                value={isEditingPage ? goToPage : currentPage.toString()}
                onChange={(e) => setGoToPage(e.target.value)}
                onKeyDown={handleGoToPageKeyDown}
                onBlur={handleGoToPageBlur}
                onFocus={handleGoToPageFocus}
                className="h-8 min-w-18"
                placeholder="1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                of {totalPages}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    className="h-8 w-8 p-0 text-sm"
                    onClick={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={async () => {
                  if (
                    enableInfiniteScroll &&
                    !table.getCanNextPage() &&
                    hasNextPage &&
                    onFetchNextPage
                  ) {
                    // Call onFetchNextPage when we're at the last page of current data AND there's more data available
                    await onFetchNextPage()
                    // After fetching next page, move to the next page in the table
                    setTimeout(() => table.setPageIndex(table.getPageCount() - 1), 100)
                  } else {
                    // Use normal pagination for all other cases
                    table.nextPage()
                  }
                }}
                disabled={
                  enableInfiniteScroll
                    ? (!hasNextPage && !table.getCanNextPage()) || isFetchingNextPage
                    : !table.getCanNextPage()
                }
              >
                <span className="sr-only">Go to next page</span>
                {enableInfiniteScroll && !table.getCanNextPage() && isFetchingNextPage ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => {
                  // Always go to the last page of current data, regardless of infinite scroll
                  table.setPageIndex(table.getPageCount() - 1)
                }}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
