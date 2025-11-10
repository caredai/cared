import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/user/')({
  beforeLoad: () => {
    throw redirect({
      to: '/user/profile',
    })
  },
})
