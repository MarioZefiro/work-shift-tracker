import { describe, expect, it } from 'vitest'
import { DEFAULT_SHIFT_TYPES } from './cycle'
import { ROTATION_PATTERN, generateRotation } from './rotation'

const base = { startDate: '2026-10-19', weeks: 1, timeZone: 'Europe/Rome', types: DEFAULT_SHIFT_TYPES }

describe('generateRotation', () => {
  it('uses the three eight-hour shifts, two days each, then two days of rest', () => {
    expect(ROTATION_PATTERN).toEqual(['M', 'M', 'P', 'P', 'N', 'N', 'R', 'R'])
  })

  it('starts each person at their own position in the cycle', () => {
    const shifts = generateRotation({ ...base, members: [{ userId: 'a', offset: 0 }, { userId: 'b', offset: 2 }] })
    const codes = (id: string) => shifts.filter((s) => s.userId === id).map((s) => s.code)
    expect(codes('a')).toEqual(['M', 'M', 'P', 'P', 'N', 'N', 'R'])
    expect(codes('b')).toEqual(['P', 'P', 'N', 'N', 'R', 'R', 'M'])
  })

  it('gives every person one shift per day for the whole number of weeks', () => {
    const shifts = generateRotation({ ...base, weeks: 8, members: [{ userId: 'a', offset: 0 }, { userId: 'b', offset: 4 }] })
    expect(shifts.filter((s) => s.userId === 'a')).toHaveLength(56)
    expect(shifts.filter((s) => s.userId === 'b')).toHaveLength(56)
  })

  it('makes the night of 24 October 2026 last eight real hours although the clocks go back', () => {
    // From Monday 19 October with offset 0, 24 October is the sixth day: the second night.
    const night = generateRotation({ ...base, members: [{ userId: 'a', offset: 0 }] }).find((s) => s.startsAt.startsWith('2026-10-24'))
    expect(night?.code).toBe('N')
    expect((Date.parse(night!.endsAt) - Date.parse(night!.startsAt)) / 3_600_000).toBe(8)
  })

  it('never produces two shifts for the same person starting at the same instant', () => {
    const shifts = generateRotation({ ...base, weeks: 12, members: [{ userId: 'a', offset: 3 }, { userId: 'b', offset: 7 }] })
    expect(new Set(shifts.map((s) => `${s.userId}|${s.startsAt}`)).size).toBe(shifts.length)
  })

  it('rejects a position outside the cycle, a bad number of weeks and an empty list of people', () => {
    expect(() => generateRotation({ ...base, members: [{ userId: 'a', offset: 8 }] })).toThrow(RangeError)
    expect(() => generateRotation({ ...base, members: [{ userId: 'a', offset: -1 }] })).toThrow(RangeError)
    expect(() => generateRotation({ ...base, members: [{ userId: 'a', offset: 1.5 }] })).toThrow(RangeError)
    expect(() => generateRotation({ ...base, weeks: 0, members: [{ userId: 'a', offset: 0 }] })).toThrow(RangeError)
    expect(() => generateRotation({ ...base, weeks: 13, members: [{ userId: 'a', offset: 0 }] })).toThrow(RangeError)
    expect(() => generateRotation({ ...base, members: [] })).toThrow(RangeError)
  })
})
