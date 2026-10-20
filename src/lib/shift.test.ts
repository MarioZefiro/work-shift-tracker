import { expect, test } from 'vitest'
import { isRest } from './shift'
import type { ShiftCode } from './types'

test('isRest is true only for R', () => {
  expect(isRest('R')).toBe(true)
  const codes: ShiftCode[] = ['M', 'P', 'N']
  expect(codes.map(isRest)).toEqual([false, false, false])
})
