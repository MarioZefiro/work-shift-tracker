import { buildMonth } from '../lib/home'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTH = new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', month: 'long' })

interface Props {
  today: string // YYYY-MM-DD in the group's time zone
  counts: Record<string, number>
}

export function MiniMonth({ today, counts }: Props) {
  const [year, month] = today.split('-').map(Number)
  const monthName = MONTH.format(new Date(Date.UTC(year, month - 1, 1)))
  return (
    <table className="mini-month">
      <caption>
        {monthName} {year}
      </caption>
      <thead>
        <tr>
          {WEEKDAYS.map((d) => (
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
              return (
                <td
                  key={j}
                  aria-label={`${day} ${monthName}, ${n} in servizio`}
                  aria-current={date === today ? 'date' : undefined}
                  data-level={Math.min(n, 4)}
                >
                  {day}
                  <span aria-hidden="true">{n}</span>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
