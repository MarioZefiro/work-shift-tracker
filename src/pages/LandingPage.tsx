import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'

export function LandingPage({ onStart }: { onStart: () => void }) {
  const { t } = useI18n()
  return (
    <main className="landing">
      <img className="landing-logo" src="/favicon.svg" alt="" width="72" height="72" />
      <h1>Turni</h1>
      <p>{t('landing.intro')}</p>
      <p className="hint" role="note">
        {t('landing.notice')}
      </p>
      <LanguageSelect />
      <button type="button" className="button" onClick={onStart}>
        {t('landing.start')}
      </button>
    </main>
  )
}
