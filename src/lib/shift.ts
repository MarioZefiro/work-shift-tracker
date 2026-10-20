import type { ShiftCode } from './types'

const CODES: readonly ShiftCode[] = ['M', 'P', 'N', 'R']

export const isRest = (code: ShiftCode): boolean => code === 'R'

export function parseShiftCode(value: string): ShiftCode {
  const code = CODES.find((c) => c === value)
  if (!code) throw new RangeError(`unknown shift code "${value}"`)
  return code
}
