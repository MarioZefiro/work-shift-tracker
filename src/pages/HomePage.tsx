import { useCallback, useEffect, useState } from 'react'
import type { DataSource } from '../data/DataSource'
import { formatShift } from '../lib/format'
import { todayView, workingCountByDate } from '../lib/home'
import type { Group, Shift, ShiftType } from '../lib/types'
import { MiniMonth } from './MiniMonth'

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; group: Group; shifts: Shift[] }

const pad = (n: number) => String(n).padStart(2, '0')
const DAY = new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long' })
const TODAY = new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const asUtc = (date: string) => new Date(`${date}T12:00:00Z`)

export function HomePage({ source, now }: { source: DataSource; now: Date }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    source
      .group()
      .then(async (group) => {
        // Month range plus 3 days so "next shifts" still work at month end.
        const [y, m] = new Intl.DateTimeFormat('en-CA', { timeZone: group.timeZone, year: 'numeric', month: '2-digit' })
          .format(now)
          .split('-')
          .map(Number)
        const last = new Date(Date.UTC(y, m, 3))
        const to = `${last.getUTCFullYear()}-${pad(last.getUTCMonth() + 1)}-${pad(last.getUTCDate())}`
        const shifts = await source.shifts({ from: `${y}-${pad(m)}-01`, to })
        setState({ status: 'ready', group, shifts })
      })
      .catch(() => setState({ status: 'error' }))
  }, [source, now])

  useEffect(load, [load])

  if (state.status === 'loading') {
    return (
      <div role="status" className="skeleton-wrap">
        <span className="visually-hidden">Caricamento</span>
        <div className="skeleton" aria-hidden="true" />
        <div className="skeleton" aria-hidden="true" />
        <div className="skeleton tall" aria-hidden="true" />
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="card">
        <p>Non riesco a caricare i turni. Controlla la connessione e riprova.</p>
        <button type="button" className="button" onClick={load}>
          Riprova
        </button>
      </div>
    )
  }

  const { group, shifts } = state
  const typeOf = (code: Shift['code']): ShiftType => group.shiftTypes.find((t) => t.code === code)!
  const { today, mine, colleagues, upcoming } = todayView({
    now,
    timeZone: group.timeZone,
    userId: source.userId,
    shifts,
    members: group.members,
  })
  const dateOf = (s: Shift) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: group.timeZone }).format(new Date(s.startsAt))

  return (
    <div className="home">
      <h1>Oggi, {TODAY.format(asUtc(today))}</h1>
      <section className="card" data-code={mine?.code ?? 'none'} aria-label="Il tuo turno di oggi">
        {!mine ? (
          <p>Nessun turno oggi</p>
        ) : mine.code === 'R' ? (
          <p>Oggi riposi</p>
        ) : (
          <>
            <p className="big">Il tuo turno: {formatShift(mine, typeOf(mine.code), group.timeZone)}</p>
            {colleagues.length > 0 && <p>Con te: {colleagues.map((c) => c.name).join(', ')}</p>}
          </>
        )}
      </section>

      <section aria-labelledby="prossimi">
        <h2 id="prossimi">Prossimi</h2>
        {upcoming.length === 0 ? (
          <p>Nessun turno nei prossimi giorni.</p>
        ) : (
          <ul className="upcoming" aria-label="Prossimi turni">
            {upcoming.map((s) => (
              <li key={s.id} data-code={s.code}>
                {cap(DAY.format(asUtc(dateOf(s))))} · {formatShift(s, typeOf(s.code), group.timeZone)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="mese">
        <h2 id="mese">Il mese</h2>
        <p className="hint">Il numero piccolo indica quante persone sono in servizio.</p>
        <MiniMonth today={today} counts={workingCountByDate(shifts, group.timeZone)} />
      </section>
    </div>
  )
}
