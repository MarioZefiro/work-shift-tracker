import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18n } from './I18nContext'
import { LOCALES, resolveLocale, storeLocale, type Locale } from './locales'
import { createTranslate } from './translate'

export function I18nProvider({ initialLocale, children }: { initialLocale?: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? resolveLocale())

  const value = useMemo<I18n>(() => {
    const messages = LOCALES.find((l) => l.code === locale)!.messages
    const lf = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })
    return {
      locale,
      setLocale: (next) => {
        storeLocale(next)
        setLocaleState(next)
      },
      t: createTranslate(locale, messages),
      list: (items) => lf.format(items),
    }
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = value.t('app.title')
  }, [locale, value])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
