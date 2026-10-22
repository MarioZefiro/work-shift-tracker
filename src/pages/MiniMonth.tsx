import { useI18n } from '../i18n/I18nContext'
import { cap, utcFormatter } from '../lib/format'
import { buildMonth } from '../lib/home'
import type { ShiftCode } from '../lib/types'

interface Props {
  today: string // YYYY-MM-DD in the group's time zone
  counts: Record<string, number>
  hasData: ReadonlySet<string> // dates with any shift, rest included
  mine: Record<string, ShiftCode> // the signed-in user's shift code per date
}

export function MiniMonth({ today, counts, hasData, mine }: Props) {
  const { locale, t } = useI18n()
  const [year, month] = today.split('-').map(Number)
  const fmt = (opts: Intl.DateTimeFormatOptions) => utcFormatter(locale, opts)
  const monthName = fmt({ month: 'long' }).format(new Date(Date.UTC(year, month - 1, 1)))
  // 2024-01-01 is a Monday; the grid starts on Monday.
  const weekdays = Array.from({ length: 7 }, (_, i) => cap(fmt({ weekday: 'short' }).format(new Date(Date.UTC(2024, 0, 1 + i)))))
  const dayLabel = fmt({ day: 'numeric', month: 'long' })
  return (
    <table className="mini-month">
      <caption>
        {monthName} {year}
      </caption>
      <thead>
        <tr>
          {weekdays.map((d) => (
            <th key={d} scope="col">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {buildMonth(year, month - 1).map((week, i) => (
          <tr key={i}>
            {week.map((date, j) => {
              if (!date) return <td key={j} />
              const day = Number(date.slice(8))
              const n = counts[date] ?? 0
              const known = hasData.has(date)
              const own = mine[date]
              const when = dayLabel.format(new Date(Date.UTC(year, month - 1, day)))
              return (
                <td
                  key={j}
                  aria-label={`${when}, ${known ? t('month.working', { count: n }) : t('month.noData')}${own ? `, ${t('month.yours', { shift: t(`shift.${own}`) })}` : ''}`}
                  aria-current={date === today ? 'date' : undefined}
                  data-level={known ? Math.min(n, 4) : 0}
                >
                  <div className="day-top" aria-hidden="true">
                    {day}
                    {own && (
                      <span className="day-mark" data-code={own}>
                        {own}
                      </span>
                    )}
                  </div>
                  <span aria-hidden="true">{known ? n : '–'}</span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
