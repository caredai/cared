import { useTheme } from 'next-themes'
import { QRCodeSVG } from 'qrcode.react'

export function QrCode({ value, size }: { value: string; size?: number }) {
  const { resolvedTheme } = useTheme()

  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor={resolvedTheme === 'light' ? 'white' : 'black'}
      fgColor={resolvedTheme === 'light' ? 'black' : 'white'}
      level={'L'}
      includeMargin={false}
    />
  )
}
