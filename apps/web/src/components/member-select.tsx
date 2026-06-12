import type { ComponentPropsWithoutRef } from 'react'
import type { VirtualizerHandle } from 'virtua'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, User as UserIcon } from 'lucide-react'
import { Virtualizer } from 'virtua'

import { Avatar, AvatarFallback, AvatarImage } from '@cared/ui/components/avatar'
import { Button } from '@cared/ui/components/button'
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

import type { Member } from '@/hooks/use-members'
import { useMembers } from '@/hooks/use-members'

export type { Member }

interface MemberSelectProps {
  /** Controlled open state */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Selected member ID */
  value?: string
  /** Callback when selection changes */
  onValueChange?: (value: string) => void
  /** Optional className for the trigger button */
  className?: string
  /** Placeholder text when no member is selected */
  placeholder?: string
}

/**
 * MemberSelect component
 * A searchable dropdown for selecting account members
 */
export function MemberSelect({
  open,
  onOpenChange,
  value,
  onValueChange,
  className,
  placeholder = 'Select member...',
}: MemberSelectProps) {
  const { members } = useMembers()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen

  // Find the selected member
  const selectedMember = useMemo(() => {
    if (!value) {
      return
    }
    return members.find((m) => m.id === value)
  }, [members, value])

  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch('')
  }, [isOpen])

  const filteredMembers = useMemo(() => {
    if (!search) {
      return members
    }
    const searchTerm = search.trim().toLowerCase()
    return members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(searchTerm) ||
        member.user.email.toLowerCase().includes(searchTerm) ||
        member.id.includes(searchTerm),
    )
  }, [members, search])

  return (
    <Popover onOpenChange={handleOpenChange} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={isOpen}
          className={cn('w-full justify-between gap-2', className)}
          variant="outline"
        >
          {selectedMember ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="size-4">
                <AvatarImage
                  alt={selectedMember.user.name}
                  src={selectedMember.user.image ?? undefined}
                />
                <AvatarFallback className="text-2xs">
                  {selectedMember.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedMember.user.name}</span>
            </span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[calc(var(--radix-popover-content-available-height)-16px)] w-(--radix-popover-trigger-width)! p-0"
        // https://github.com/radix-ui/primitives/issues/1159#issuecomment-3018464158
        onTouchMove={(e) => {
          e.stopPropagation()
        }}
        onWheel={(e) => {
          e.stopPropagation()
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            className="h-9"
            onValueChange={setSearch}
            placeholder="Search members..."
            value={search}
          />
          <CommandList className="max-h-full overflow-y-hidden">
            <CommandEmpty>No members found</CommandEmpty>
            {filteredMembers.length > 0 && (
              <CommandGroup className="p-2">
                <div className="max-h-[calc(var(--radix-popover-content-available-height)-71px)] overflow-y-auto">
                  <MemberList
                    filteredMembers={filteredMembers}
                    handleOpenChange={handleOpenChange}
                    isOpen={isOpen}
                    onValueChange={onValueChange}
                    selectedMember={selectedMember}
                    value={value}
                  />
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface MemberListProps {
  isOpen?: boolean
  handleOpenChange?: (open: boolean) => void
  value?: string
  onValueChange?: (value: string) => void
  filteredMembers: Member[]
  selectedMember?: Member
}

/**
 * MemberList component
 * Virtualized list of members for performance
 */
function MemberList({
  isOpen,
  handleOpenChange,
  value,
  onValueChange,
  filteredMembers,
  selectedMember,
}: MemberListProps) {
  const ref = useRef<VirtualizerHandle>(null)

  useLayoutEffect(() => {
    const handle = ref.current
    if (!isOpen || !handle || !selectedMember) {
      return
    }
    const index = filteredMembers.findIndex((m) => m.id === selectedMember.id)
    if (index >= 0) {
      handle.scrollToIndex(index)
    }
  }, [isOpen, filteredMembers, selectedMember])

  return (
    <Virtualizer ref={ref}>
      {filteredMembers.map((member) => (
        <MemberItem
          isSelected={value === member.id}
          key={member.id}
          member={member}
          onSelect={() => {
            onValueChange?.(member.id)
            handleOpenChange?.(false)
          }}
        />
      ))}
    </Virtualizer>
  )
}

interface MemberItemProps {
  member: Member
  isSelected: boolean
  onSelect: () => void
}

/**
 * MemberItem component
 * Individual member item in the list
 */
function MemberItem({ member, isSelected, onSelect }: MemberItemProps) {
  return <MemberItemTrigger isSelected={isSelected} member={member} onSelect={onSelect} />
}

/** Avatar, name, and email layout shared by member pickers and tables. */
export function MemberIdentity({
  member,
  className,
  avatarClassName,
}: {
  member: Member
  className?: string
  avatarClassName?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <Avatar className={cn('size-6', avatarClassName)}>
        <AvatarImage alt={member.user.name} src={member.user.image ?? undefined} />
        <AvatarFallback className="text-xs">
          <UserIcon className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{member.user.name}</span>
        <span className="truncate text-muted-foreground text-xs">{member.user.email}</span>
      </div>
    </div>
  )
}

const MemberItemTrigger = ({
  member,
  isSelected,
  onSelect,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof CommandItem> & {
  member: Member
  isSelected: boolean
  onSelect: () => void
}) => (
  <CommandItem
    className="flex w-full items-center justify-between gap-2"
    onSelect={onSelect}
    value={member.id}
    {...props}
  >
    <MemberIdentity member={member} className="flex-1" />
    <Check className={cn('h-4 w-4 text-green-500', isSelected ? 'opacity-100' : 'opacity-0')} />
    {children}
  </CommandItem>
)
