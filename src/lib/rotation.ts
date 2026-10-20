import { generateCycle } from './cycle'
import type { Shift, ShiftCode, ShiftType } from './types'

// Three eight-hour shifts, two days each, then two days of rest. Fixed in code: a group cannot define its own yet.
export const ROTATION_PATTERN: readonly ShiftCode[] = ['M', 'M', 'P', 'P', 'N', 'N', 'R', 'R']
export const MAX_WEEKS = 12

// The codes of `days` consecutive days for someone who starts at position `offset` of the cycle.
export const rotationCodes = (offset: number, days: number): ShiftCode[] =>
  Array.from({ length: days }, (_, i) => ROTATION_PATTERN[(offset + i) % ROTATION_PATTERN.length])

export function generateRotation(opts: {
  members: { userId: string; offset: number }[]
  startDate: string
  weeks: number
  timeZone: string
  types: ShiftType[]
}): Shift[] {
  const { members, startDate, weeks, timeZone, types } = opts
  if (members.length === 0) throw new RangeError('pick at least one person')
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > MAX_WEEKS) throw new RangeError(`weeks must be between 1 and ${MAX_WEEKS}`)
  return members.flatMap(({ userId, offset }) => {
    if (!Number.isInteger(offset) || offset < 0 || offset >= ROTATION_PATTERN.length) {
      throw new RangeError(`offset ${offset} is outside the cycle`)
    }
    const pattern = rotationCodes(offset, ROTATION_PATTERN.length)
    return generateCycle({ userId, pattern, startDate, weeks, timeZone, types })
  })
}
