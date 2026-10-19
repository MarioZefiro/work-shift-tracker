import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { DataSource } from '../data/DataSource'
import type { Group } from '../lib/types'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; group: Group }

// Shared loading / error / ready handling for the read-only group pages.
export function GroupGate({ source, children }: { source: DataSource; children: (group: Group) => ReactNode }) {
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
        <span className="visually-hidden">Caricamento</span>
        <div className="skeleton" aria-hidden="true" />
        <div className="skeleton" aria-hidden="true" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="card">
        <p>Non riesco a caricare i dati. Controlla la connessione e riprova.</p>
        <button type="button" className="button" onClick={load}>
          Riprova
        </button>
      </div>
    )
  }
  return <>{children(state.group)}</>
}
