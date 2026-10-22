import { expect, it } from 'vitest'
import { formatShift } from './format'
import type { Shift, ShiftType } from './types'

it('formats label and local time range', () => {
  const type: ShiftType = { code: 'M', label: 'Mattina', startTime: '06:00', durationMinutes: 480 }
  const shift: Shift = {
    id: '1',
    userId: 'me',
    code: 'M',
    startsAt: '2026-10-19T04:00:00Z',
    endsAt: '2026-10-19T12:00:00Z',
  }
  expect(formatShift(shift, type, 'Europe/Rome')).toBe('Mattina 06:00–14:00')
})

it('shows rest without a time range', () => {
  const type: ShiftType = { code: 'R', label: 'Riposo', startTime: '00:00', durationMinutes: 1440 }
  const shift: Shift = {
    id: '2',
    userId: 'me',
    code: 'R',
    startsAt: '2026-10-19T22:00:00Z',
    endsAt: '2026-10-20T22:00:00Z',
  }
  expect(formatShift(shift, type, 'Europe/Rome')).toBe('Riposo')
})
