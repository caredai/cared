'use client'

import type { FC } from 'react'
import React, { useEffect } from 'react'
import i18next from 'i18next'

import type { Locale } from './languages'
import { setLocaleOnClient } from '.'
import I18NContext from './context'

export interface II18nProps {
  locale: Locale
  children: React.ReactNode
}

const I18n: FC<II18nProps> = ({ locale, children }) => {
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
export default React.memo(I18n)
