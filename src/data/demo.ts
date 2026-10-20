import { DEFAULT_SHIFT_TYPES } from '../lib/cycle'
import { generateRotation } from '../lib/rotation'
import { addDays, localDateIn } from '../lib/time'
import type { Group, Member } from '../lib/types'
import type { DataSource } from './DataSource'

export const TIME_ZONE = 'Europe/Rome'
export const DEMO_GROUP_ID = 'demo-group'
export const DEMO_USER_ID = 'demo-luca'
const WEEKS = 8
// Distinct rotations so members are never all on the same shift.
const OFFSETS = [0, 2, 4, 6, 1]

const MEMBERS: Member[] = [
  { id: 'demo-anna', name: 'Anna', role: 'manager' },
  { id: DEMO_USER_ID, name: 'Luca', role: 'member' },
  { id: 'demo-sara', name: 'Sara', role: 'member' },
  { id: 'demo-marco', name: 'Marco', role: 'member' },
  { id: 'demo-elena', name: 'Elena', role: 'member' },
]

function mondayOf(date: string): string {
  const back = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
  return addDays(date, -back)
}

export function createDemoSource(now: Date): DataSource {
  const startDate = mondayOf(localDateIn(now, TIME_ZONE))
  const group: Group = {
    id: DEMO_GROUP_ID,
    name: 'Reparto demo',
    timeZone: TIME_ZONE,
    members: MEMBERS,
    shiftTypes: DEFAULT_SHIFT_TYPES,
  }
  const shifts = generateRotation({
    members: MEMBERS.map((m, i) => ({ userId: m.id, offset: OFFSETS[i] })),
    startDate,
    weeks: WEEKS,
    timeZone: TIME_ZONE,
    types: DEFAULT_SHIFT_TYPES,
  })

  return {
    userId: DEMO_USER_ID,
    group: () => Promise.resolve(group),
    shifts: ({ from, to }) =>
      Promise.resolve(
        shifts.filter((s) => {
          const day = localDateIn(new Date(s.startsAt), TIME_ZONE)
          return day >= from && day <= to
        }),
      ),
  }
}
