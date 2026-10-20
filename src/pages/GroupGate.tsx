import { useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'
import type { DataSource } from '../data/DataSource'
import type { Group } from '../lib/types'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; group: Group }

// Shared loading / error / ready handling for the read-only group pages.
// `extra` stays visible while loading or after an error, so a failed load never traps the user
// (language and demo exit remain reachable).
export function GroupGate({
  source,
  extra,
  children,
}: {
  source: DataSource
  extra?: ReactNode
  children: (group: Group) => ReactNode
}) {
  const { t } = useI18n()
  const [state, setState] = useState<State>({ status: 'loading' })

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Ignore a response that was superseded by a retry, a new source or unmount.
    let cancelled = false
    setState({ status: 'loading' })
    source
      .group()
      .then((group) => {
        if (!cancelled) setState({ status: 'ready', group })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [source, attempt])

  if (state.status === 'loading') {
    return (
      <>
        <div role="status" className="skeleton-wrap">
          <span className="visually-hidden">{t('state.loading')}</span>
          <div className="skeleton" aria-hidden="true" />
          <div className="skeleton" aria-hidden="true" />
        </div>
        <LanguageSelect />
        {extra}
      </>
    )
  }
  if (state.status === 'error') {
    return (
      <>
        <div role="alert" className="card">
          <p>{t('error.group')}</p>
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            {t('state.retry')}
          </button>
        </div>
        <LanguageSelect />
        {extra}
      </>
    )
  }
  return <>{children(state.group)}</>
}
