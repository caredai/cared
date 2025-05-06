'use client'

import { faBars, faMagicWandSparkles, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'

export function Input() {
  return (
    <div className="pt-[1px] pb-[5px] bg-transparent">
      <div className="flex flex-row items-center rounded-b-lg px-1 text-sm bg-background focus-within:ring-1 focus-within:ring-ring">
        <button className="inline-flex">
          <FontAwesomeIcon
            icon={faBars}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
        <button className="inline-flex">
          <FontAwesomeIcon
            icon={faMagicWandSparkles}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
        <AutoGrowTextarea
          className="flex-1 min-h-[36px] max-h-[50dvh] text-white focus:outline-none border-0 focus-visible:ring-0 resize-y rounded-none"
          placeholder="Type your message..."
        />
        <button className="inline-flex ml-1">
          <FontAwesomeIcon
            icon={faPaperPlane}
            size="2x"
            className="fa-fw text-muted-foreground hover:text-foreground transition-colors duration-200"
          />
        </button>
      </div>
    </div>
  )
}
