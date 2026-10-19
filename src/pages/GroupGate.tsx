import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'
import type { DataSource } from '../data/DataSource'
import type { Group } from '../lib/types'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; group: Group }

// Shared loading / error / ready handling for the read-only group pages.
export function GroupGate({ source, children }: { source: DataSource; children: (group: Group) => ReactNode }) {
  const { t } = useI18n()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    source
      .group()
      .then((group) => setState({ status: 'ready', group }))
      .catch(() => setState({ status: 'error' }))
  }, [source])

  useEffect(load, [load])

  if (state.status === 'loading') {
    return (
      <div role="status" className="skeleton-wrap">
        <span className="visually-hidden">{t('state.loading')}</span>
        <div className="skeleton" aria-hidden="true" />
        <div className="skeleton" aria-hidden="true" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="card">
        <p>{t('error.group')}</p>
        <button type="button" className="button" onClick={load}>
          {t('state.retry')}
        </button>
      </div>
    )
  }
  return <>{children(state.group)}</>
}
