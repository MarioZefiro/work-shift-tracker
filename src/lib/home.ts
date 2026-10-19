import { localDateIn } from './time'
import type { Member, Shift } from './types'

// Calendar arithmetic on date strings: adding 24h in ms breaks on DST days.
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function todayView(a: {
  now: Date
  timeZone: string
  userId: string
  shifts: Shift[]
  members: Member[]
}): { today: string; mine: Shift | null; colleagues: Member[]; upcoming: Shift[] } {
  const today = localDateIn(a.now, a.timeZone)
  const dateOf = (s: Shift) => localDateIn(new Date(s.startsAt), a.timeZone)
  const mine = a.shifts.find((s) => s.userId === a.userId && dateOf(s) === today) ?? null

  const colleagueIds = new Set(
    mine && mine.code !== 'R'
      ? a.shifts
          .filter((s) => s.userId !== a.userId && s.code === mine.code && dateOf(s) === today)
          .map((s) => s.userId)
      : [],
  )
  const last = addDays(today, 3)
  const upcoming = a.shifts
    .filter((s) => s.userId === a.userId && dateOf(s) > today && dateOf(s) <= last)
    .sort((x, y) => x.startsAt.localeCompare(y.startsAt))

  return { today, mine, colleagues: a.members.filter((m) => colleagueIds.has(m.id)), upcoming }
}

export function workingCountByDate(shifts: Shift[], timeZone: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of shifts) {
    if (s.code === 'R') continue
    const d = localDateIn(new Date(s.startsAt), timeZone)
    counts[d] = (counts[d] ?? 0) + 1
  }
  return counts
}

export function buildMonth(year: number, monthIndex: number): (string | null)[][] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lead = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7 // Monday = 0
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(monthIndex + 1)}-${pad(d)}`)
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
