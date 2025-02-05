import { createContext, use } from 'react'

import type { Locale } from './languages'

interface II18NContext {
  locale: Locale
  i18n: Record<string, any>
  setLocaleOnClient: (_lang: Locale, _reloadPage?: boolean) => void
}

const I18NContext = createContext<II18NContext>({
  locale: 'en-US',
  i18n: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLocaleOnClient: (_lang: Locale, _reloadPage?: boolean) => {},
})

const useI18N = () => use(I18NContext)

export const useGetLanguage = () => {
  const { locale } = useI18N()

  return locale
}

export default I18NContext
