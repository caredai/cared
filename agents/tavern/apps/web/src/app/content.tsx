'use client'

import {
  faAddressCard,
  faBookAtlas,
  faCubes,
  faFaceSmile,
  faFont,
  faPanorama,
  faPlugCircleExclamation,
  faSliders,
  faUserCog,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AutoGrowTextarea } from '@/components/auto-grow-textarea'

export function Content() {
  return (
    <div
      className="h-screen w-full flex justify-center bg-cover bg-no-repeat"
      style={{
        backgroundImage: 'url("/images/bedroom cyberpunk.jpg")',
      }}
    >
      <div className="w-full lg:w-1/2 h-full flex flex-col relative">
        <header className="h-[35px] bg-zinc-800 text-white flex items-center px-4 shadow-[0_2px_20px_rgba(0,0,0,0.7)] z-3000">
          <nav className="w-full flex flex-row items-center justify-around">
            {[
              faSliders,
              faPlugCircleExclamation,
              faFont,
              faBookAtlas,
              faUserCog,
              faPanorama,
              faCubes,
              faFaceSmile,
              faAddressCard,
            ].map((fa) => (
              <button key={fa.iconName}>
                <FontAwesomeIcon
                  icon={fa}
                  size="2x"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                />
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1 bg-zinc-900 overflow-y-auto p-4"></main>

        <div className="py-[1px] bg-transparent">
          <AutoGrowTextarea
            className="w-full min-h-[36px] max-h-[50dvh] text-white focus:outline-none bg-black border-0 focus-visible:ring-0 resize-y rounded-none rounded-b-lg"
            placeholder="Type your message..."
          />
        </div>
      </div>
    </div>
  )
}
