import { describe, expect, it } from 'vitest'
import { buildMonth, rosterByDate, todayView, workingCountByDate } from './home'
import type { Member, Shift, ShiftCode } from './types'

const TZ = 'Europe/Rome'
const members: Member[] = [
  { id: 'me', name: 'Io', role: 'member' },
  { id: 'anna', name: 'Anna', role: 'member' },
]

// Rome is UTC+2 on these dates, so 06:00 local is 04:00Z.
function shift(id: string, userId: string, code: ShiftCode, day: string): Shift {
  return { id, userId, code, startsAt: `${day}T04:00:00Z`, endsAt: `${day}T12:00:00Z` }
}

const now = new Date('2026-10-19T12:00:00Z')

describe('todayView', () => {
  it('finds my shift, colleagues on the same shift and my next 3 days', () => {
    const shifts = [
      shift('1', 'me', 'M', '2026-10-19'),
      shift('2', 'anna', 'M', '2026-10-19'),
      shift('3', 'me', 'P', '2026-10-20'),
      shift('4', 'me', 'N', '2026-10-22'),
      shift('5', 'me', 'M', '2026-10-23'),
      shift('6', 'anna', 'M', '2026-10-20'),
    ]
    const v = todayView({ now, timeZone: TZ, userId: 'me', shifts, members })
    expect(v.today).toBe('2026-10-19')
    expect(v.mine?.code).toBe('M')
    expect(v.colleagues).toEqual([members[1]])
    expect(v.upcoming.map((s) => s.id)).toEqual(['3', '4'])
  })

  it('keeps a night shift in progress after local midnight', () => {
    const night = (id: string, userId: string): Shift => ({
      id,
      userId,
      code: 'N',
      startsAt: '2026-03-28T21:00:00Z',
      endsAt: '2026-03-29T05:00:00Z',
    })
    const shifts = [night('1', 'me'), night('2', 'anna'), shift('3', 'me', 'R', '2026-03-29')]
    const v = todayView({ now: new Date('2026-03-29T00:00:00Z'), timeZone: TZ, userId: 'me', shifts, members })
    expect(v.mine?.code).toBe('N')
    expect(v.colleagues).toEqual([members[1]])
  })

  it('has no colleagues when today is a rest day', () => {
    const shifts = [shift('1', 'me', 'R', '2026-10-19'), shift('2', 'anna', 'R', '2026-10-19')]
    expect(todayView({ now, timeZone: TZ, userId: 'me', shifts, members }).colleagues).toEqual([])
  })

  it('uses the group time zone for today', () => {
    const late = new Date('2026-10-19T23:30:00Z')
    expect(todayView({ now: late, timeZone: TZ, userId: 'me', shifts: [], members }).today).toBe('2026-10-20')
  })

  it('returns null when there is no shift today', () => {
    const v = todayView({ now, timeZone: TZ, userId: 'me', shifts: [], members })
    expect(v.mine).toBeNull()
    expect(v.colleagues).toEqual([])
    expect(v.upcoming).toEqual([])
  })

  it('counts upcoming days by calendar across the DST change', () => {
    // 2026-10-25 is the end of DST in Rome (25h day).
    const shifts = [shift('1', 'me', 'M', '2026-10-25'), shift('2', 'me', 'M', '2026-10-27')]
    const v = todayView({ now: new Date('2026-10-24T12:00:00Z'), timeZone: TZ, userId: 'me', shifts, members })
    expect(v.upcoming.map((s) => s.id)).toEqual(['1', '2'])
  })
})

describe('workingCountByDate', () => {
  it('excludes rest days', () => {
    const shifts = [
      shift('1', 'me', 'M', '2026-10-19'),
      shift('2', 'anna', 'M', '2026-10-19'),
      shift('3', 'x', 'R', '2026-10-19'),
    ]
    expect(workingCountByDate(shifts, TZ)).toEqual({ '2026-10-19': 2 })
  })
})

describe('buildMonth', () => {
  it('starts weeks on Monday and pads with null', () => {
    const weeks = buildMonth(2026, 9)
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
  })

  it('handles a month starting on Monday', () => {
    expect(buildMonth(2026, 5)[0][0]).toBe('2026-06-01')
  })
})

describe('rosterByDate', () => {
  const shifts = [
    shift('1', 'anna', 'P', '2026-10-22'),
    shift('2', 'me', 'M', '2026-10-22'),
    shift('3', 'anna', 'R', '2026-10-23'),
    shift('4', 'ghost', 'M', '2026-10-23'),
  ]
  const roster = rosterByDate(shifts, members, TZ)

  it('lists several people on a day, same start ordered by name', () => {
    expect(roster['2026-10-22'].map((e) => e.name)).toEqual(['Anna', 'Io'])
  })

  it('keeps rest and finds my own shift', () => {
    expect(roster['2026-10-23'][0].shift.code).toBe('R')
    expect(roster['2026-10-22'].find((e) => e.userId === 'me')?.shift.code).toBe('M')
  })

  it('has no entry for a day without data and skips unknown users', () => {
    expect(roster['2026-10-24']).toBeUndefined()
    expect(roster['2026-10-23']).toHaveLength(1)
  })
})
