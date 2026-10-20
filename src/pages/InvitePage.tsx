import { useState } from 'react'
import { useAsync } from '../app/useAsync'
import { GroupFullError, InvalidInviteError, type InviteInfo } from '../data/supabase/groups'
import { useI18n } from '../i18n/I18nContext'
import type { MessageKey } from '../i18n/messages/it'
import { LoadState } from './LoadState'

type Problem = 'invalid' | 'full' | 'error'
const PROBLEM_TEXT: Record<Problem, MessageKey> = {
  invalid: 'invite.invalid',
  full: 'invite.full',
  error: 'invite.error',
}

// `load` must keep the same identity between renders, or the preview is fetched again each time.
export function InvitePage({
  load,
  onAccept,
  onDecline,
}: {
  load: () => Promise<InviteInfo | null>
  onAccept: () => Promise<void>
  onDecline: () => void
}) {
  const { t } = useI18n()
  const { status, data, reload } = useAsync(load, [load])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [busy, setBusy] = useState(false)

  async function accept() {
    setBusy(true)
    setProblem(null)
    try {
      await onAccept()
    } catch (error) {
      setProblem(error instanceof InvalidInviteError ? 'invalid' : error instanceof GroupFullError ? 'full' : 'error')
      setBusy(false)
    }
  }

  if (status !== 'ready') return <LoadState failed={status === 'error'} errorMessage={t('invite.error')} onRetry={reload} />

  if (data === null) {
    return (
      <main className="page">
        <h1>{t('invite.title')}</h1>
        <p role="alert">{t('invite.invalid')}</p>
        <button type="button" className="button" onClick={onDecline}>
          {t('invite.back')}
        </button>
      </main>
    )
  }

  return (
    <main className="page">
      <h1>{t('invite.title')}</h1>
      <p className="card">
        <strong>{data?.groupName}</strong>
        <br />
        {t('invite.members', { count: data?.memberCount ?? 0 })}
      </p>
      <div className="actions">
        <button type="button" className="button" disabled={busy} onClick={accept}>
          {t('invite.accept')}
        </button>
        <button type="button" className="button button-secondary" disabled={busy} onClick={onDecline}>
          {t('invite.decline')}
        </button>
      </div>
      {problem && <p role="alert">{t(PROBLEM_TEXT[problem])}</p>}
    </main>
  )
}
