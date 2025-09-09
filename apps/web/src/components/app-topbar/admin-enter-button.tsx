'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'

import { Button } from '@cared/ui/components/button'

import { useSession } from '@/hooks/use-session'

export function AdminEnterButton() {
  const { user } = useSession()

  if (user.role !== 'admin') {
    return
  }

  return (
    <Button
      size="sm"
      className="bg-yellow-500 text-yellow-800 hover:bg-yellow-400 dark:bg-yellow-600 dark:text-yellow-100 dark:hover:bg-yellow-500"
      asChild
    >
      <Link href="/admin">
        <LogIn />
        <span>Admin</span>
      </Link>
    </Button>
  )
}
