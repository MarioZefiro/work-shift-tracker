import type { Shift, ShiftType } from './types'

function hhmm(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

export function formatShift(shift: Shift, type: ShiftType, timeZone: string): string {
  return `${type.label} ${hhmm(shift.startsAt, timeZone)}–${hhmm(shift.endsAt, timeZone)}`
}
