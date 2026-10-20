import type { DataSource } from './data/DataSource'
import { DEFAULT_SHIFT_TYPES } from './lib/cycle'
import type { Group, Shift } from './lib/types'

export const testGroup: Group = {
  id: 'g',
  name: 'Reparto prova',
  timeZone: 'Europe/Rome',
  members: [
    { id: 'me', name: 'Luca', role: 'member' },
    { id: 'a', name: 'Anna', role: 'manager' },
    { id: 'b', name: 'Marco', role: 'member' },
  ],
  shiftTypes: DEFAULT_SHIFT_TYPES,
}

export const testShifts: Shift[] = [
  { id: 'me-20', userId: 'me', code: 'M', startsAt: '2026-10-20T04:00:00Z', endsAt: '2026-10-20T12:00:00Z' },
]

export function makeSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    userId: 'me',
    group: () => Promise.resolve(testGroup),
    shifts: () => Promise.resolve(testShifts),
    ...overrides,
  }
}
