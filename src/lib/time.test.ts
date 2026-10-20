import { describe, expect, it } from 'vitest'
import {
  AmbiguousLocalTimeError,
  NonexistentLocalTimeError,
  localDateIn,
  zonedToUtc,
} from './time'

describe('time', () => {
  it('converts a winter local time', () => {
    expect(zonedToUtc('2026-01-15', '22:00', 'Europe/Rome').toISOString()).toBe('2026-01-15T21:00:00.000Z')
  })

  it('converts a summer local time', () => {
    expect(zonedToUtc('2026-07-15', '22:00', 'Europe/Rome').toISOString()).toBe('2026-07-15T20:00:00.000Z')
  })

  it('throws on a nonexistent local time', () => {
    expect(() => zonedToUtc('2026-03-29', '02:30', 'Europe/Rome')).toThrow(NonexistentLocalTimeError)
  })

  it('throws on an ambiguous local time', () => {
    expect(() => zonedToUtc('2026-10-25', '02:30', 'Europe/Rome')).toThrow(AmbiguousLocalTimeError)
  })

  it('localDateIn uses the given zone', () => {
    expect(localDateIn(new Date('2026-10-19T23:30:00Z'), 'Europe/Rome')).toBe('2026-10-20')
  })

  it.each([
    ['2026-02-30', '10:00'],
    ['2026-13-01', '10:00'],
    ['2026-1-5', '10:00'],
    ['', '10:00'],
    ['2026-03-10', '25:99'],
    ['2026-03-10', '24:00'],
    ['2026-03-10', ''],
  ])('rejects invalid input %j %j', (date, time) => {
    expect(() => zonedToUtc(date, time, 'Europe/Rome')).toThrow(RangeError)
  })
})
