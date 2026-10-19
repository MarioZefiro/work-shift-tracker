import { describe, expect, it } from 'vitest'
import { DEFAULT_SHIFT_TYPES, generateCycle } from './cycle'
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
