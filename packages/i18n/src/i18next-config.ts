import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import { locales } from './languages'

const loadLangResources = (lang: string) => ({
  translation: {
    /* eslint @typescript-eslint/no-require-imports: 0 */
    workflow: require(`./${lang}/workflow`).default,
  },
})

const resources = locales.reduce((acc, lang) => {
  // @ts-expect-error: ignore
  acc[lang] = loadLangResources(lang)
  return acc
}, {})

void i18next.use(initReactI18next).init({
  lng: undefined,
  fallbackLng: 'en-US',
  resources,
})
