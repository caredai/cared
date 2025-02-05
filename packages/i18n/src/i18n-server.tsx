import React from 'react'

import I18N from './i18n'
import { getLocaleOnServer } from './server'

const I18NServer = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocaleOnServer()

  return <I18N {...{ locale }}>{children}</I18N>
}

export default I18NServer
