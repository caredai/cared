import CaredLogo from '/cared.svg?react'

export function Logo({ showWordMark }: { showWordMark?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 transform cursor-pointer duration-100 ease-in-out">
      <CaredLogo className="size-6" />
      {showWordMark && <span className="text-base font-medium">Cared</span>}
    </div>
  )
}
