import { SiteHeader } from '@/components/site-header'

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  )
}
