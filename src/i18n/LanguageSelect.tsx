import { useId } from 'react'
import { useI18n } from './I18nContext'
import { isLocale, LOCALES } from './locales'

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n()
  const id = useId()
  return (
    <div className="language-select">
      <label htmlFor={id}>{t('language.label')}</label>{' '}
      <select id={id} value={locale} onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value)
        }}>
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  )
}
