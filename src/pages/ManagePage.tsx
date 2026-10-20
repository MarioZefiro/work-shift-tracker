import { useId, useState, type FormEvent } from 'react'
import { useAsync } from '../app/useAsync'
import type { DataSource } from '../data/DataSource'
import { ShiftConflictError } from '../data/supabase/shiftsAdmin'
import { useI18n } from '../i18n/I18nContext'
import { buildShift } from '../lib/cycle'
import { cap, formatShift, utcFormatter } from '../lib/format'
import { localDateIn } from '../lib/time'
import type { Group, Shift, ShiftCode } from '../lib/types'
import { LoadState } from './LoadState'

type Failure = { kind: 'assign' | 'delete' } | { kind: 'conflict'; name: string; date: string }

export function ManagePage({
  source,
  now,
  isManager,
  onAssign,
  onDelete,
}: {
  source: DataSource
  now: Date
  isManager: boolean
  onAssign: (shift: Shift) => Promise<void>
  onDelete: (shiftId: string) => Promise<void>
}) {
  const { t } = useI18n()
  if (!isManager) {
    return (
      <div className="page">
        <h1>{t('manage.title')}</h1>
        <p>{t('manage.notAllowed')}</p>
      </div>
    )
  }
  return <Board source={source} now={now} onAssign={onAssign} onDelete={onDelete} t={t} />
}

type T = ReturnType<typeof useI18n>['t']

function Board({
  source,
  now,
  onAssign,
  onDelete,
  t,
}: {
  source: DataSource
  now: Date
  onAssign: (shift: Shift) => Promise<void>
  onDelete: (shiftId: string) => Promise<void>
  t: T
}) {
  // This month and the next, so a shift can be placed ahead of time.
  const { status, data, reload } = useAsync(async () => {
    const group = await source.group()
    const [y, m] = localDateIn(now, group.timeZone).split('-').map(Number)
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const to = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10)
    return { group, from, to, shifts: await source.shifts({ from, to }) }
  }, [source, now])

  if (!data) {
    return <LoadState failed={status === 'error'} errorMessage={t('error.shifts')} onRetry={reload} />
  }
  return (
    <Form
      group={data.group}
      from={data.from}
      to={data.to}
      shifts={data.shifts}
      today={localDateIn(now, data.group.timeZone)}
      onAssign={onAssign}
      onDelete={onDelete}
      reload={reload}
      t={t}
    />
  )
}

function Form({
  group,
  from,
  to,
  shifts,
  today,
  onAssign,
  onDelete,
  reload,
  t,
}: {
  group: Group
  from: string
  to: string
  shifts: Shift[]
  today: string
  onAssign: (shift: Shift) => Promise<void>
  onDelete: (shiftId: string) => Promise<void>
  reload: () => void
  t: T
}) {
  const { locale } = useI18n()
  const ids = [useId(), useId(), useId()]
  const [userId, setUserId] = useState(group.members[0]?.id ?? '')
  const [date, setDate] = useState(today)
  const [code, setCode] = useState<ShiftCode>(group.shiftTypes[0]?.code ?? 'M')
  const [failure, setFailure] = useState<Failure | null>(null)
  const nameOf = (id: string) => group.members.find((m) => m.id === id)?.name ?? id
  const dayOf = (s: Shift) => localDateIn(new Date(s.startsAt), group.timeZone)
  const dateLabel = (d: string) => cap(utcFormatter(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${d}T00:00:00Z`)))

  async function assign(e: FormEvent) {
    e.preventDefault()
    setFailure(null)
    const clash = { kind: 'conflict' as const, name: nameOf(userId), date: dateLabel(date) }
    // Checked here for a clear message; the schema's unique key is the safety net when the list is stale.
    if (shifts.some((s) => s.userId === userId && dayOf(s) === date)) return setFailure(clash)
    try {
      await onAssign(buildShift(userId, code, date, group.timeZone, group.shiftTypes))
      reload()
    } catch (error) {
      setFailure(error instanceof ShiftConflictError ? clash : { kind: 'assign' })
    }
  }

  async function remove(id: string) {
    setFailure(null)
    try {
      await onDelete(id)
      reload()
    } catch {
      setFailure({ kind: 'delete' })
    }
  }

  return (
    <div className="page">
      <h1>{t('manage.title')}</h1>
      <form className="form" onSubmit={assign}>
        <label htmlFor={ids[0]}>{t('manage.member')}</label>
        <select id={ids[0]} value={userId} onChange={(e) => setUserId(e.target.value)}>
          {group.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label htmlFor={ids[1]}>{t('manage.date')}</label>
        <input id={ids[1]} type="date" required min={from} max={to} value={date} onChange={(e) => setDate(e.target.value)} />
        <label htmlFor={ids[2]}>{t('manage.shiftType')}</label>
        <select id={ids[2]} value={code} onChange={(e) => setCode(e.target.value as ShiftCode)}>
          {group.shiftTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {t(`shift.${type.code}`)}
            </option>
          ))}
        </select>
        <button type="submit" className="button">
          {t('manage.assign')}
        </button>
      </form>
      {failure && (
        <p role="alert">
          {failure.kind === 'conflict'
            ? t('manage.assign.conflict', { name: failure.name, date: failure.date })
            : failure.kind === 'assign'
              ? t('manage.assign.error')
              : t('manage.delete.error')}
        </p>
      )}
      <h2>{t('manage.list')}</h2>
      {shifts.length === 0 && <p>{t('manage.none')}</p>}
      <ul className="shift-list">
        {shifts.map((s) => {
          const type = group.shiftTypes.find((ty) => ty.code === s.code)
          return (
            <li key={s.id} className="card">
              <span>
                {dateLabel(dayOf(s))} · {nameOf(s.userId)} ·{' '}
                {type ? formatShift(s, { ...type, label: t(`shift.${s.code}`) }, group.timeZone) : s.code}
              </span>
              <button type="button" className="button button-secondary" onClick={() => remove(s.id)}>
                {t('manage.delete')}
                <span className="visually-hidden">
                  {' '}
                  — {nameOf(s.userId)}, {dateLabel(dayOf(s))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
