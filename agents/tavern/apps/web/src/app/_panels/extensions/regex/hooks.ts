import type { RegexScript } from '@tavern/core'
import { useCallback } from 'react'
import { runRegexScript } from '@tavern/core'

import { useSubstituteMacros } from '@/hooks/use-macro'

export function useDebugRegex() {
  const { evaluateMacros } = useSubstituteMacros()

  return useCallback(
    (regexScript: RegexScript, rawString: string) =>
      runRegexScript(
        {
          ...regexScript,
          disabled: false,
        },
        rawString,
        evaluateMacros,
      ),
    [evaluateMacros],
  )
}
