import { Spinner } from '@cared/ui/components/spinner'

export function Loading() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <Spinner />
    </div>
  )
}
