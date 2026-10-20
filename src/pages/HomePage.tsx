import { useAsync } from '../app/useAsync'
import type { DataSource } from '../data/DataSource'
import { useI18n } from '../i18n/I18nContext'
import { cap, formatShift, utcFormatter } from '../lib/format'
import { todayView, workingCountByDate } from '../lib/home'
import { isRest } from '../lib/shift'
import { localDateIn } from '../lib/time'
import type { Shift } from '../lib/types'
import { LoadState } from './LoadState'
import { MiniMonth } from './MiniMonth'

const asUtc = (date: string) => new Date(`${date}T12:00:00Z`)

export function HomePage({ source, now }: { source: DataSource; now: Date }) {
  const { locale, t, list } = useI18n()
  const { status, data, reload } = useAsync(async () => {
    const group = await source.group()
    // The range ends on the 3rd of next month so "next shifts" still work at month end.
    const today = localDateIn(now, group.timeZone)
    const [y, m] = today.split('-').map(Number)
    const to = new Date(Date.UTC(y, m, 3)).toISOString().slice(0, 10)
    const shifts = await source.shifts({ from: `${today.slice(0, 7)}-01`, to })
    return { group, shifts }
  }, [source, now])

  if (!data) {
    return <LoadState failed={status === 'error'} errorMessage={t('error.shifts')} onRetry={reload} tall />
  }

  const { group, shifts } = data
  // Labels come from the dictionary; the group's stored label is only the Italian default.
  const describe = (s: Shift): string => {
    const type = group.shiftTypes.find((x) => x.code === s.code)
    // A group may lack a type; show the bare code rather than crash.
    return type ? formatShift(s, { ...type, label: t(`shift.${s.code}`) }, group.timeZone) : s.code
  }
  const dayFmt = (opts: Intl.DateTimeFormatOptions) => utcFormatter(locale, opts)
  const { today, mine, colleagues, upcoming } = todayView({
    now,
    timeZone: group.timeZone,
    userId: source.userId,
    shifts,
    members: group.members,
  })
  const dateOf = (s: Shift) => localDateIn(new Date(s.startsAt), group.timeZone)

  return (
    <div className="home">
      <h1>{t('home.title', { date: dayFmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(asUtc(today)) })}</h1>
      <section className="card" data-code={mine?.code ?? 'none'} aria-label={t('home.mineLabel')}>
        {!mine ? (
          <p>{t('home.none')}</p>
        ) : isRest(mine.code) ? (
          <p>{t('home.rest')}</p>
        ) : (
          <>
            <p className="big">{t('home.mine', { shift: describe(mine) })}</p>
            {colleagues.length > 0 && <p>{t('home.withYou', { names: list(colleagues.map((c) => c.name)) })}</p>}
          </>
        )}
      </section>

      <section aria-labelledby="prossimi">
        <h2 id="prossimi">{t('home.upcoming')}</h2>
        {upcoming.length === 0 ? (
          <p>{t('home.upcomingEmpty')}</p>
        ) : (
          <ul className="upcoming" aria-label={t('home.upcomingList')}>
            {upcoming.map((s) => (
              <li key={s.id} data-code={s.code}>
                {cap(dayFmt({ weekday: 'short', day: 'numeric', month: 'long' }).format(asUtc(dateOf(s))))} · {describe(s)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-month" aria-labelledby="mese">
        <h2 id="mese">{t('home.month')}</h2>
        <p className="hint">{t('home.monthHint')}</p>
        <MiniMonth
          today={today}
          counts={workingCountByDate(shifts, group.timeZone)}
          hasData={new Set(shifts.map((s) => localDateIn(new Date(s.startsAt), group.timeZone)))}
        />
      </section>
    </div>
  )
}
