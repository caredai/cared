'use client'

import Image from 'next/image'

import logo from '@/public/images/thinker.png'

export function Logo() {
  return (
    <div className="flex items-center">
      <Image src={logo} alt="Thinker" width={32} height={32} className="-scale-x-100" />
      <span className="text-xl font-bold inline-block text-transparent bg-clip-text bg-gradient-to-br from-cyan-700 via-red-500 to-yellow-500 animate-text">
        ownx
      </span>
    </div>
  )
}
