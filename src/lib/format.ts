import type { Shift, ShiftType } from './types'

function hhmm(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

export function formatShift(shift: Shift, type: ShiftType, timeZone: string): string {
  return `${type.label} ${hhmm(shift.startsAt, timeZone)}–${hhmm(shift.endsAt, timeZone)}`
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// UTC so a calendar date (YYYY-MM-DD) never shifts with the viewer's zone.
export const utcFormatter = (locale: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts })
