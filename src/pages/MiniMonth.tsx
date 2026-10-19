import { useI18n } from '../i18n/I18nContext'
import { buildMonth } from '../lib/home'

interface Props {
  today: string // YYYY-MM-DD in the group's time zone
  counts: Record<string, number>
  hasData: ReadonlySet<string> // dates with any shift, rest included
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function MiniMonth({ today, counts, hasData }: Props) {
  const { locale, t } = useI18n()
  const [year, month] = today.split('-').map(Number)
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts })
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
              const when = dayLabel.format(new Date(Date.UTC(year, month - 1, day)))
              return (
                <td
                  key={j}
                  aria-label={`${when}, ${known ? t('month.working', { count: n }) : t('month.noData')}`}
                  aria-current={date === today ? 'date' : undefined}
                  data-level={known ? Math.min(n, 4) : 0}
                >
                  {day}
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
