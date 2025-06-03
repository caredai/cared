'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

import { cn } from '@ownxai/ui/lib/utils'

import { backgroundFittings } from '@/app/_panels/background-image'
import { useBackgroundSettings } from '@/hooks/use-settings'
import { signIn } from '@/lib/sign-in'
import { useTRPC } from '@/trpc/client'
import { Content } from './content'
import { Input } from './input'
import { Navbar } from './navbar'

export function PageContent() {
  const trpc = useTRPC()
  const { data: session } = useQuery(trpc.user.session.queryOptions())
  if (!session?.user) {
    void signIn()
  }

  const backgroundSettings = useBackgroundSettings()

  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const image = new Image()
    image.src = `${backgroundSettings.active.url}`

    image.onload = () => {
      if (ref.current) {
        ref.current.style.backgroundImage = `url("${backgroundSettings.active.url}")`
      }
    }

    return () => {
      image.src = ''
    }
  }, [backgroundSettings.active.url])

  return (
    <div
      ref={ref}
      className={cn(
        'h-screen w-full flex justify-center bg-no-repeat transition-[background-image] duration-500',
        backgroundFittings[backgroundSettings.fitting],
      )}
    >
      <div className="w-full lg:w-1/2 h-full flex flex-col relative">
        <Navbar />
        <Content />
        <Input />
      </div>
    </div>
  )
}
