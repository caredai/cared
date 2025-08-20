'use client'

import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

import { Button } from '@cared/ui/components/button'

import { useSession } from '@/hooks/use-session'

export function AdminEnterButton() {
  const router = useRouter()
  const { user } = useSession()

  if (user.role !== 'admin') {
    return
  }

  return (
    <Button
      size="sm"
      className="bg-yellow-500 text-yellow-800 hover:bg-yellow-400 dark:bg-yellow-600 dark:text-yellow-100 dark:hover:bg-yellow-500"
      onClick={() => {
        router.push('/admin')
      }}
    >
      <LogIn />
      <span>Admin</span>
    </Button>
  )
}
