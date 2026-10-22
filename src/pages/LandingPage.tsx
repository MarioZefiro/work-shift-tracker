import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'

export function LandingPage({
  onStart,
  onLogin,
  focusHeading = false,
}: {
  onStart: () => void
  onLogin?: () => void
  focusHeading?: boolean
}) {
  const { t } = useI18n()
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Only after leaving the demo: the focused button just unmounted, and at first load focus must stay put.
  useEffect(() => {
    if (focusHeading) headingRef.current?.focus()
  }, [focusHeading])
  return (
    <main className="landing">
      <img className="landing-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="72" height="72" />
      <h1 tabIndex={-1} ref={headingRef}>
        Turni
      </h1>
      <p>{t('landing.intro')}</p>
      <p className="hint" role="note">
        {t('landing.notice')}
      </p>
      <img
        className="landing-preview"
        src={`${import.meta.env.BASE_URL}home.png`}
        alt={t('landing.preview')}
        width="390"
        height="909"
      />
      <button type="button" className="button" onClick={onStart}>
        {t('landing.start')}
      </button>
      {onLogin && (
        <button type="button" className="button button-secondary" onClick={onLogin}>
          {t('landing.login')}
        </button>
      )}
      <footer className="landing-footer">
        <LanguageSelect />
      </footer>
    </main>
  )
}
