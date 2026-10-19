import type { Shift, ShiftCode, ShiftType } from './types'
import { zonedToUtc } from './time'

export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  { code: 'M', label: 'Mattina', startTime: '06:00', durationMinutes: 480 },
  { code: 'P', label: 'Pomeriggio', startTime: '14:00', durationMinutes: 480 },
  { code: 'N', label: 'Notte', startTime: '22:00', durationMinutes: 480 },
  { code: 'R', label: 'Riposo', startTime: '00:00', durationMinutes: 1440 },
]

// Calendar arithmetic on the date string: adding 24h of milliseconds breaks on DST days.
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function generateCycle(opts: {
  userId: string
  pattern: ShiftCode[]
  startDate: string
  weeks: number
  timeZone: string
  types: ShiftType[]
}): Shift[] {
  const { userId, pattern, startDate, weeks, timeZone, types } = opts
  if (pattern.length === 0) throw new RangeError('pattern must not be empty')

  return Array.from({ length: weeks * 7 }, (_, i) => {
    const code = pattern[i % pattern.length]
    const type = types.find((t) => t.code === code)
    if (!type) throw new RangeError(`unknown shift code ${code}`)
    const date = addDays(startDate, i)
    const start = zonedToUtc(date, type.startTime, timeZone)
    // Rest spans the whole local day, which is 23 or 25 real hours on DST days.
    const end =
      code === 'R'
        ? zonedToUtc(addDays(date, 1), '00:00', timeZone)
        : new Date(start.getTime() + type.durationMinutes * 60_000)
    return { id: `${userId}:${date}`, userId, code, startsAt: start.toISOString(), endsAt: end.toISOString() }
  })
}
