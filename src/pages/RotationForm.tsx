import { useId, useState, type FormEvent } from 'react'
import type { useI18n } from '../i18n/I18nContext'
import { MAX_WEEKS, ROTATION_PATTERN, generateRotation, rotationCodes } from '../lib/rotation'
import { localDateIn } from '../lib/time'
import type { Group, Shift } from '../lib/types'

type Failure = 'none' | 'error' | { conflict: string }

// The group picks people and where each one starts in the fixed three-shift cycle; the shifts are generated.
export function RotationForm({
  group,
  today,
  shifts,
  onGenerate,
  reload,
  t,
}: {
  group: Group
  today: string
  shifts: Shift[]
  onGenerate: (shifts: Shift[]) => Promise<void>
  reload: () => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const ids = [useId(), useId()]
  const [startDate, setStartDate] = useState(today)
  const [weeks, setWeeks] = useState(8)
  // Missing = not part of the rotation. The default is nobody: nothing is generated unless someone is picked.
  const [positions, setPositions] = useState<Record<string, number>>({})
  const [failure, setFailure] = useState<Failure | null>(null)
  const picked = group.members.filter((m) => positions[m.id] !== undefined)
  const dayOf = (s: Shift) => localDateIn(new Date(s.startsAt), group.timeZone)

  function setPosition(userId: string, value: string) {
    setPositions(({ [userId]: _removed, ...rest }) => (value === '' ? rest : { ...rest, [userId]: Number(value) }))
  }

  async function generate(e: FormEvent) {
    e.preventDefault()
    setFailure(null)
    if (picked.length === 0) return setFailure('none')
    let rows: Shift[]
    try {
      rows = generateRotation({
        members: picked.map((m) => ({ userId: m.id, offset: positions[m.id] })),
        startDate,
        weeks,
        timeZone: group.timeZone,
        types: group.shiftTypes,
      })
    } catch {
      return setFailure('error')
    }
    // Checked against the loaded period; the schema's unique key catches an exact duplicate anywhere else.
    const clash = rows.find((r) => shifts.some((s) => s.userId === r.userId && dayOf(s) === dayOf(r)))
    if (clash) return setFailure({ conflict: group.members.find((m) => m.id === clash.userId)?.name ?? clash.userId })
    try {
      await onGenerate(rows)
      reload()
    } catch {
      setFailure('error')
    }
  }

  return (
    <section aria-labelledby={ids[0]}>
      <h2 id={ids[0]}>{t('manage.rotation.title')}</h2>
      <p className="hint">{t('manage.rotation.intro')}</p>
      <form className="form" onSubmit={generate}>
        <label htmlFor={ids[1]}>{t('manage.rotation.start')}</label>
        <input id={ids[1]} type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>
          {t('manage.rotation.weeks')}
          <input type="number" min={1} max={MAX_WEEKS} required value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
        </label>
        {group.members.map((m) => (
          <label key={m.id}>
            {t('manage.rotation.from', { name: m.name })}
            <select value={positions[m.id] ?? ''} onChange={(e) => setPosition(m.id, e.target.value)}>
              <option value="">{t('manage.rotation.skip')}</option>
              {ROTATION_PATTERN.map((code, i) => (
                // Positions are told apart by their number: the same shift appears twice in a row.
                <option key={i} value={i}>
                  {i + 1}. {t(`shift.${code}`)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="submit" className="button">
          {t('manage.rotation.generate')}
        </button>
      </form>
      {failure && (
        <p role="alert">
          {failure === 'none'
            ? t('manage.rotation.none')
            : failure === 'error'
              ? t('manage.rotation.error')
              : t('manage.rotation.conflict', { name: failure.conflict })}
        </p>
      )}
      {picked.length > 0 && (
        <>
          <h3>{t('manage.rotation.preview')}</h3>
          <ul className="shift-list">
            {picked.map((m) => (
              <li key={m.id} className="card">
                <strong>{m.name}</strong>
                <span>{rotationCodes(positions[m.id], 14).join(' ')}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
