import { useEffect, useMemo, useState } from 'react'
import pDebounce from 'p-debounce'

import { useActiveLanguageModel } from '@/hooks/use-model'
import { debounceTimeout } from '@/lib/debounce'
import { countTokens } from '@/lib/tokenizer'

export function useTextTokens(text: string) {
  const { activeLanguageModelId } = useActiveLanguageModel()

  const [tokens, setTokens] = useState<number>()

  const debouncedCountTokens = useMemo(() => pDebounce(countTokens, debounceTimeout.relaxed), [])

  useEffect(() => {
    if (!text) {
      setTokens(0)
      return
    }
    if (typeof tokens === 'number') {
      void debouncedCountTokens(text, activeLanguageModelId).then(setTokens)
    } else {
      void countTokens(text, activeLanguageModelId).then(setTokens)
    }
  }, [activeLanguageModelId, debouncedCountTokens, text, tokens])

  return tokens
}
