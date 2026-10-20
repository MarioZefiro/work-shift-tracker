import { useId, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function LoginPage({ onSubmit }: { onSubmit: (email: string) => Promise<void> }) {
  const { t } = useI18n()
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      await onSubmit(email.trim())
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="landing">
      <h1>{t('auth.login.title')}</h1>
      <p>{t('auth.login.intro')}</p>
      <form className="form" onSubmit={submit}>
        <label htmlFor={emailId}>{t('auth.login.email')}</label>
        <input id={emailId} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="button" disabled={status === 'sending'}>
          {status === 'sending' ? t('auth.login.sending') : t('auth.login.submit')}
        </button>
      </form>
      {/* Always in the DOM: screen readers announce changes to a live region, not one that appears with its text. */}
      <p role="status">{status === 'sent' ? t('auth.login.sent') : ''}</p>
      {status === 'error' && <p role="alert">{t('auth.login.error')}</p>}
      <LanguageSelect />
    </main>
  )
}
