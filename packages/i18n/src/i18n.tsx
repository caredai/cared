'use client'

import React, { useEffect } from 'react'
import i18next from 'i18next'

import type { Locale } from './languages'
import { setLocaleOnClient } from '.'
import I18NContext from './context'

export interface II18nProps {
  locale: Locale
  children: React.ReactNode
}

export default function I18n({ locale, children }: II18nProps) {
  useEffect(() => {
    void i18next.changeLanguage(locale)
  }, [locale])

  return (
    <I18NContext.Provider
      value={{
        locale,
        i18n: {},
        setLocaleOnClient,
      }}
    >
      {children}
    </I18NContext.Provider>
  )
}
