import languages from './languages.json'

export interface Language {
  value: string
  name: string
  example: string
}

export const locales = (languages as Language[]).map((lang) => lang.value)

export const i18n = {
  defaultLocale: 'en-US',
  locales,
} as const

export type Locale = (typeof i18n)['locales'][number]
