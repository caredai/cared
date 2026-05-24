import { SectionTitle } from '@/components/section'

interface PlaceholderPageProps {
  title: string
  description?: string
}

/** Minimal placeholder for database namespace / branch pages pending feature design. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <SectionTitle title={title} description={description} />
      <p className="text-sm text-muted-foreground">This page is not implemented yet.</p>
    </>
  )
}
