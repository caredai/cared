import i18next from 'i18next'
import Cookies from 'js-cookie'

import type { Locale } from './languages'
import { i18n } from './languages'

import './i18next-config'

const LOCALE_COOKIE_NAME = 'locale'

export const setLocaleOnClient = (locale: Locale, reloadPage = true) => {
  Cookies.set(LOCALE_COOKIE_NAME, locale)
  void i18next.changeLanguage(locale)
  if (reloadPage) {
    window.location.reload()
  }
}

export const getLocaleOnClient = (): Locale => {
  // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
  return (Cookies.get(LOCALE_COOKIE_NAME) as Locale) || i18n.defaultLocale
}
