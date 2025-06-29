import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function bytesToBase64DataUrl(bytes: Uint8Array, type = 'image/png'): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = Object.assign(new FileReader(), {
      onload: () => resolve(reader.result as string),
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      onerror: () => reject(reader.error),
    })
    reader.readAsDataURL(new File([bytes], '', { type }))
  })
}
