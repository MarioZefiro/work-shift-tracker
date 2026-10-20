import { describe, expect, it } from 'vitest'
import { DEFAULT_SHIFT_TYPES, buildShift, generateCycle } from './cycle'
import { NonexistentLocalTimeError } from './time'

const base = {
  userId: 'u1',
  pattern: ['M', 'P', 'N', 'R'] as const,
  startDate: '2026-03-26',
  weeks: 1,
  timeZone: 'Europe/Rome',
  types: DEFAULT_SHIFT_TYPES,
}
const opts = { ...base, pattern: [...base.pattern] }

describe('generateCycle', () => {
  it('repeats the pattern one shift per day', () => {
    expect(generateCycle(opts).map((s) => s.code)).toEqual(['M', 'P', 'N', 'R', 'M', 'P', 'N'])
  })

  it('keeps real duration across the spring DST change', () => {
    const n = generateCycle(opts).find((s) => s.id === 'u1:2026-03-28')!
    expect(n.startsAt).toBe('2026-03-28T21:00:00.000Z')
    expect(n.endsAt).toBe('2026-03-29T05:00:00.000Z')
  })

  it('keeps real hours across the autumn DST change', () => {
    const cycle = generateCycle({ ...opts, startDate: '2026-10-22' })
    const r = cycle.find((s) => s.id === 'u1:2026-10-25')!
    expect(r.code).toBe('R')
    expect(r.startsAt).toBe('2026-10-24T22:00:00.000Z')
    expect(r.endsAt).toBe('2026-10-25T23:00:00.000Z')
    const n = cycle.find((s) => s.id === 'u1:2026-10-24')!
    expect(n.code).toBe('N')
    expect(Date.parse(n.endsAt) - Date.parse(n.startsAt)).toBe(8 * 3_600_000)
  })

  it('ends rest at the next local midnight', () => {
    const r = generateCycle(opts).find((s) => s.id === 'u1:2026-03-29')!
    expect(r.code).toBe('R')
    expect(r.startsAt).toBe('2026-03-28T23:00:00.000Z')
    expect(r.endsAt).toBe('2026-03-29T22:00:00.000Z')
  })

  it('generates eight weeks', () => {
    expect(generateCycle({ ...opts, weeks: 8 })).toHaveLength(56)
  })

  it('rejects a nonexistent start', () => {
    const types = [{ code: 'M' as const, label: 'Odd', startTime: '02:30', durationMinutes: 60 }]
    expect(() => generateCycle({ ...opts, pattern: ['M'], startDate: '2026-03-29', types })).toThrow(
      NonexistentLocalTimeError,
    )
  })

  it('rejects an empty pattern', () => {
    expect(() => generateCycle({ ...opts, pattern: [] })).toThrow(RangeError)
  })
})

describe('buildShift', () => {
  it('gives the night of 24 October 2026 in Rome 480 real minutes, with the clocks going back that night', () => {
    const shift = buildShift('u1', 'N', '2026-10-24', 'Europe/Rome', DEFAULT_SHIFT_TYPES)
    expect(shift).toEqual({
      id: 'u1:2026-10-24',
      userId: 'u1',
      code: 'N',
      startsAt: '2026-10-24T20:00:00.000Z',
      endsAt: '2026-10-25T04:00:00.000Z',
    })
    expect((Date.parse(shift.endsAt) - Date.parse(shift.startsAt)) / 60_000).toBe(480)
  })

  it('makes rest cover the whole local day, 25 hours when the clocks go back', () => {
    const shift = buildShift('u1', 'R', '2026-10-25', 'Europe/Rome', DEFAULT_SHIFT_TYPES)
    expect((Date.parse(shift.endsAt) - Date.parse(shift.startsAt)) / 3_600_000).toBe(25)
  })

  it('rejects a code the group has no type for', () => {
    expect(() => buildShift('u1', 'N', '2026-10-24', 'Europe/Rome', [])).toThrow(RangeError)
  })

  it('is what generateCycle builds each day from', () => {
    const [first] = generateCycle({ ...base, pattern: ['N'], startDate: '2026-10-24', weeks: 1, timeZone: 'Europe/Rome', types: DEFAULT_SHIFT_TYPES })
    expect(first).toEqual(buildShift(base.userId, 'N', '2026-10-24', 'Europe/Rome', DEFAULT_SHIFT_TYPES))
  })
})
