import { createContext, useContext } from 'react'
import type { Locale } from './locales'
import type { Translate } from './translate'

export interface I18n {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
  list: (items: string[]) => string
}

export const I18nContext = createContext<I18n | null>(null)

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
