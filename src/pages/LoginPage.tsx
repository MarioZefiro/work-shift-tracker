import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function LoginPage({
  onSubmit,
  onBack,
  notice,
}: {
  onSubmit: (email: string) => Promise<void>
  onBack?: () => void
  notice?: string
}) {
  const { t } = useI18n()
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [again, setAgain] = useState(false)
  const sentRef = useRef<HTMLHeadingElement>(null)

  // The form disappears on success, so focus would be lost; move it to the message instead.
  useEffect(() => {
    if (status === 'sent') sentRef.current?.focus()
  }, [status])

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
      {notice && (
        <p role="alert" className="notice">
          {notice}
        </p>
      )}
      {status === 'sent' ? (
        <h2 tabIndex={-1} ref={sentRef}>
          {t('auth.login.sentTitle')}
        </h2>
      ) : (
        <>
          <p>{t('auth.login.intro')}</p>
          <form className="form" onSubmit={submit}>
            <label htmlFor={emailId}>{t('auth.login.email')}</label>
            <input id={emailId} type="email" required autoComplete="email" autoFocus={again} value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" className="button" disabled={status === 'sending'}>
              {status === 'sending' ? t('auth.login.sending') : t('auth.login.submit')}
            </button>
          </form>
        </>
      )}
      {/* Always in the DOM: screen readers announce changes to a live region, not one that appears with its text. */}
      <p role="status">{status === 'sent' ? t('auth.login.sent', { email }) : ''}</p>
      {status === 'sent' && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setAgain(true)
            setStatus('idle')
          }}
        >
          {t('auth.login.another')}
        </button>
      )}
      {status === 'error' && (
        <p role="alert" className="error">
          {t('auth.login.error')}
        </p>
      )}
      <LanguageSelect />
      {onBack && (
        <button type="button" className="button button-secondary" onClick={onBack}>
          {t('auth.login.back')}
        </button>
      )}
    </main>
  )
}
